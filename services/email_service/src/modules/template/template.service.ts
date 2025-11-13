import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Template, ApiResponse } from '../../common/dto';
import { CircuitBreaker } from '../../common/utils/circuit-breaker';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private cache: Map<string, { template: Template; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private templateServiceCircuitBreaker: CircuitBreaker;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.cache = new Map();
    this.templateServiceCircuitBreaker = new CircuitBreaker('TemplateService', configService);
  }

  async getTemplate(templateId: string, correlationId?: string): Promise<Template> {
    // Check cache first
    const cached = this.getCachedTemplate(templateId);
    if (cached) {
      this.logger.debug(`Template ${templateId} retrieved from cache`, {
        correlation_id: correlationId,
      });
      return cached;
    }

    // Fetch from Template Service with circuit breaker
    try {
      const template = await this.templateServiceCircuitBreaker.execute(async () => {
        this.logger.log(`Fetching template ${templateId} from Template Service`, {
          correlation_id: correlationId,
        });

        const url = `${this.configService.get('TEMPLATE_SERVICE_URL')}/templates/code/${templateId}`;

        const response = await firstValueFrom(
          this.httpService.get<ApiResponse<Template>>(url, {
            headers: {
              'X-Correlation-ID': correlationId || '',
              'x-service-key': process.env.INTERNAL_SERVICE_KEY!,
            },
            timeout: 5000,
          }),
        );

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error || 'Failed to fetch template');
        }

        return response.data.data;
      });

      // Cache the template
      this.cacheTemplate(templateId, template);

      return template;
    } catch (error: any) {
      this.logger.error(`Failed to fetch template ${templateId}`, {
        error: error.message,
        correlation_id: correlationId,
      });

      // If circuit is open, try to use stale cache
      if (this.templateServiceCircuitBreaker.isOpen()) {
        const stale = this.getStaleCache(templateId);
        if (stale) {
          this.logger.warn(`Using stale cached template ${templateId} (circuit breaker open)`, {
            correlation_id: correlationId,
          });
          return stale;
        }
      }

      throw error;
    }
  }

  renderTemplate(
    template: Template,
    variables: Record<string, any>,
  ): {
    subject: string;
    body: string;
  } {
    let subject = template.subject;
    let body = template.body;

    // Helper to escape HTML special characters to prevent XSS when inserting into HTML body
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Replace variables in subject and body
    Object.entries(variables).forEach(([key, value]) => {
      const safeValue = value === null || value === undefined ? '' : String(value);
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      // Subject is typically plain text (or escaped by consumer) - keep raw string
      subject = subject.replace(placeholder, safeValue);
      // Body may contain HTML - escape inserted values to avoid XSS
      body = body.replace(placeholder, escapeHtml(safeValue));
    });

    // Check for unreplaced variables
    const unreplacedSubject = subject.match(/{{[^}]+}}/g);
    const unreplacedBody = body.match(/{{[^}]+}}/g);

    if (unreplacedSubject || unreplacedBody) {
      this.logger.warn('Template contains unreplaced variables', {
        template_id: template.id,
        unreplaced_subject: unreplacedSubject,
        unreplaced_body: unreplacedBody,
      });
    }

    return { subject, body };
  }

  private getCachedTemplate(templateId: string): Template | null {
    const cached = this.cache.get(templateId);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.template;
    }

    return null;
  }

  private getStaleCache(templateId: string): Template | null {
    const cached = this.cache.get(templateId);
    return cached ? cached.template : null;
  }

  private cacheTemplate(templateId: string, template: Template): void {
    this.cache.set(templateId, {
      template,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.log('Template cache cleared');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.configService.get('TEMPLATE_SERVICE_URL')}/health`;
      const response = await firstValueFrom(this.httpService.get(url, { timeout: 3000 }));
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getCircuitBreakerState() {
    return this.templateServiceCircuitBreaker.getState();
  }
}
