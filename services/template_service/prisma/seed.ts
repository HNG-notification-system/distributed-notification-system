import { PrismaClient, TemplateType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.templateVersion.deleteMany();
  await prisma.template.deleteMany();

  // Seed templates
  const templates = [
    {
      template_code: 'welcome-email',
      name: 'Welcome Email',
      type: TemplateType.EMAIL,
      subject: 'Welcome to {{company_name}}!',
      body: `
        <h1>Hello {{name}}!</h1>
        <p>Welcome to {{company_name}}. We're excited to have you on board.</p>
        <p>To get started, please verify your email by clicking the link below:</p>
        <p><a href="{{link}}">Verify Email</a></p>
        <p>Best regards,<br>The {{company_name}} Team</p>
      `,
      variables: ['name', 'company_name', 'link'],
      language: 'en',
      is_active: true,
      created_by: 'system',
    },
    {
      template_code: 'password-reset',
      name: 'Password Reset Email',
      type: TemplateType.EMAIL,
      subject: 'Reset Your Password',
      body: `
        <h1>Password Reset Request</h1>
        <p>Hi {{name}},</p>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <p><a href="{{link}}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      variables: ['name', 'link'],
      language: 'en',
      is_active: true,
      created_by: 'system',
    },
    {
      template_code: 'order-confirmation',
      name: 'Order Confirmation Email',
      type: TemplateType.EMAIL,
      subject: 'Order #{{order_id}} Confirmed',
      body: `
        <h1>Thank You for Your Order!</h1>
        <p>Hi {{name}},</p>
        <p>Your order #{{order_id}} has been confirmed.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Total: {{ total }}</li>
          <li>Delivery: {{delivery_date}}</li>
        </ul>
        <p>Track your order: <a href="{{link}}">View Order</a></p>
      `,
      variables: ['name', 'order_id', 'total', 'delivery_date', 'link'],
      language: 'en',
      is_active: true,
      created_by: 'system',
    },
    {
      template_code: 'push-welcome',
      name: 'Welcome Push Notification',
      type: TemplateType.PUSH,
      subject: 'Welcome {{name}}! 🎉',
      body: 'Thanks for joining {{company_name}}. Tap to get started!',
      variables: ['name', 'company_name'],
      language: 'en',
      is_active: true,
      created_by: 'system',
    },
  ];

  for (const template of templates) {
    const created = await prisma.template.create({ data: template });

    // Create initial version
    await prisma.templateVersion.create({
      data: {
        template_id: created.id,
        version: 1,
        subject: created.subject,
        body: created.body,
        variables: created.variables as any,
        changed_by: 'system',
        change_reason: 'Initial seed',
      },
    });

    console.log(`✅ Created template: ${template.template_code}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
