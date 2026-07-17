import { pool, q, initSchema } from './db.js';

async function seed() {
  console.log('Starting seed...');
  await initSchema();

  const companies = [
    { name: 'Alorica DR', email: 'hr@alorica.com', industry: 'BPO', desc: 'Global customer experience provider.' },
    { name: 'Teleperformance', email: 'jobs@tp.com', industry: 'BPO', desc: 'Customer care experts.' },
    { name: 'MediaCorp', email: 'hr@mediacorp.com', industry: 'Media', desc: 'Video and media production.' },
    { name: 'PhotoStudio', email: 'contact@photostudio.com', industry: 'Photography', desc: 'Professional photography services.' },
    { name: 'BuildIt Inc', email: 'jobs@buildit.com', industry: 'Construction', desc: 'Construction and blacksmithing.' },
    { name: 'SalesForce Pro', email: 'hr@salesforcepro.com', industry: 'Sales', desc: 'Global sales team.' },
    { name: 'SocialBuzz', email: 'hello@socialbuzz.com', industry: 'Marketing', desc: 'Community management and marketing.' },
    { name: 'DataInsights', email: 'hr@datainsights.com', industry: 'Tech', desc: 'Data analytics and reporting.' },
    { name: 'CCS Companies', email: 'hr@ccscompanies.com', industry: 'BPO', desc: 'Customer service and business solutions.' },
    { name: 'FullStack', email: 'hr@fullstack.com', industry: 'IT/Tech', desc: 'The most transparent IT talent network connecting highly skilled individuals with top global companies.' },
    { name: 'PedidosYa', email: 'jobs@pedidosya.com', industry: 'Logistics/Tech', desc: 'Leading technology company in delivery and quick-commerce in Latin America.' },
    { name: 'BairesDev', email: 'jobs@bairesdev.com', industry: 'IT/Tech', desc: 'Nearshore software outsourcing company.' },
  ];

  const companyIds = [];

  for (const c of companies) {
    const { rows } = await q(
      `INSERT INTO users (email, name, role, onboarded) VALUES ($1, $2, 'company', true) ON CONFLICT (email) DO NOTHING RETURNING id`,
      [c.email, c.name]
    );
    let id;
    if (rows.length > 0) {
      id = rows[0].id;
      await q(
        `INSERT INTO company_profiles (user_id, company_name, industry, description) VALUES ($1, $2, $3, $4)`,
        [id, c.name, c.industry, c.desc]
      );
    } else {
      const res = await q(`SELECT id FROM users WHERE email=$1`, [c.email]);
      id = res.rows[0].id;
    }
    companyIds.push({ id, name: c.name });
  }

  const getCompanyId = (name) => companyIds.find(c => c.name.includes(name))?.id || companyIds[0].id;

  const jobsToCreate = [
    {
      company_id: getCompanyId('CCS Companies'),
      title: 'Account Manager',
      category: 'Customer Service',
      description: 'The primary responsibility of the Account Manager is to build and maintain strong, long-lasting customer relationships and partnerships with new and existing clients. The Account Manager will facilitate communication between clients and all other supporting divisions within The CCS Companies organization.',
      job_type: 'full-time',
      budget: '$60,000 - $65,000/year',
    },
    {
      company_id: getCompanyId('CCS Companies'),
      title: 'Consumer Correspondence Representative',
      category: 'Customer Service',
      description: 'Review and analyze consumer correspondence and follow organization, state and Federal regulations regarding the dispute or validation process. Operate out of the Santo Domingo office.',
      job_type: 'full-time',
      budget: 'Competitive',
    },
    {
      company_id: getCompanyId('CCS Companies'),
      title: 'Customer Service Agent - Portsmouth 2026',
      category: 'Customer Service',
      description: 'Are you looking to work a Monday - Friday schedule AND make a great base pay AND make an amazing BONUS!?!? The CCS Companies are hiring for shifts in our Salem location! Hourly base pay is up to $16.00/hr ($17.00/hr if bilingual Spanish). On average our Associates are currently earning a bonus of $400-$600 every 2 weeks!',
      job_type: 'full-time',
      budget: '$16.00/hr - $17.00/hr',
    },
    {
      company_id: getCompanyId('FullStack'),
      title: 'Full Stack Developer (Java + Kotlin + React) - Remote - Latin America',
      category: 'Programmers',
      description: 'FullStack is the most transparent IT talent network, connecting highly skilled individuals with top global companies and Silicon Valley startups for remote, on-demand projects.',
      job_type: 'full-time',
      budget: 'Competitive',
    },
    {
      company_id: getCompanyId('FullStack'),
      title: 'Senior Elixir Developer, React focused Projects - Remote - Latin America',
      category: 'Programmers',
      description: 'Senior Elixir Developer role focusing on React projects. Remote in Latin America.',
      job_type: 'full-time',
      budget: 'Competitive',
    },
    {
      company_id: getCompanyId('PedidosYa'),
      title: 'Data Sr Analyst',
      category: 'Data Entry',
      description: 'PedidosYa forma parte de Delivery Hero, empresa líder mundial en servicios de delivery. On-site in Santo Domingo, Distrito Nacional, Dominican Republic.',
      job_type: 'full-time',
      budget: 'Competitive',
    },
    {
      company_id: getCompanyId('BairesDev'),
      title: 'Ingeniero React - Trabajo Remoto',
      category: 'Front End',
      description: 'Ingeniero React - Remote work. BairesDev is the fastest growing Nearshore Software Outsourcing company.',
      job_type: 'full-time',
      budget: 'Competitive',
    },
    // 10 Call Center Agents (EN, FR, ES)
    ...Array(10).fill(0).map((_, i) => ({
      company_id: getCompanyId('Alorica'),
      title: `Call Center Agent - Multilingual (Position ${i+1})`,
      category: 'Customer Service',
      description: 'We are hiring Call Center Agents fluent in English, French, and Spanish. Join our Summer Job Fair and earn up to $1,100 USD hiring bonus!',
      job_type: 'full-time',
      budget: '$500 - $800/month',
    })),

    // 10 Video Editing
    ...Array(10).fill(0).map((_, i) => ({
      company_id: getCompanyId('MediaCorp'),
      title: `Video Editor (Position ${i+1})`,
      category: 'Design & Creative',
      description: 'Looking for an experienced video editor to work on commercial projects. Premiere Pro and After Effects required.',
      job_type: 'contract',
      budget: '$20 - $35/hr',
    })),

    // 5 Photographers
    ...Array(5).fill(0).map((_, i) => ({
      company_id: getCompanyId('PhotoStudio'),
      title: `Professional Photographer (Position ${i+1})`,
      category: 'Design & Creative',
      description: 'Requesting a professional photographer for upcoming events and product shoots.',
      job_type: 'part-time',
      budget: '$50 - $100/hr',
    })),

    // 5 Blacksmiths
    ...Array(5).fill(0).map((_, i) => ({
      company_id: getCompanyId('BuildIt'),
      title: `Experienced Blacksmith (Position ${i+1})`,
      category: 'Other',
      description: 'Individual profiles requesting blacksmiths for custom metalwork and structural support.',
      job_type: 'contract',
      budget: '$15 - $25/hr',
    })),

    // 3 Constructors
    ...Array(3).fill(0).map((_, i) => ({
      company_id: getCompanyId('BuildIt'),
      title: `Constructor / Builder (Position ${i+1})`,
      category: 'Other',
      description: 'Looking for reliable constructors for new building projects.',
      job_type: 'full-time',
      budget: '$20 - $30/hr',
    })),

    // 5 Sales Agents (Creole, EN)
    ...Array(5).fill(0).map((_, i) => ({
      company_id: getCompanyId('SalesForce'),
      title: `Sales Agent - Creole & English (Position ${i+1})`,
      category: 'Sales & Marketing',
      description: 'Hiring sales agents fluent in Creole and English. Earn top commissions!',
      job_type: 'full-time',
      budget: '$600/month + commission',
    })),

    // 5 Community Managers
    ...Array(5).fill(0).map((_, i) => ({
      company_id: getCompanyId('SocialBuzz'),
      title: `Community Manager (Position ${i+1})`,
      category: 'Sales & Marketing',
      description: 'Manage our social media presence, engage with the community, and drive growth.',
      job_type: 'full-time',
      budget: '$800 - $1200/month',
    })),

    // 5 Data Analysts
    ...Array(5).fill(0).map((_, i) => ({
      company_id: getCompanyId('DataInsights'),
      title: `Data Analyst (Position ${i+1})`,
      category: 'Data Entry',
      description: 'Looking for a data analyst with SQL and Python skills to help us make sense of our metrics.',
      job_type: 'full-time',
      budget: '$1500 - $2500/month',
    })),
  ];

  for (const job of jobsToCreate) {
    await q(
      `INSERT INTO jobs (company_id, title, category, description, job_type, budget) VALUES ($1, $2, $3, $4, $5, $6)`,
      [job.company_id, job.title, job.category, job.description, job.job_type, job.budget]
    );
  }

  console.log('Seed complete! Added ' + jobsToCreate.length + ' jobs.');
  pool.end();
}

seed().catch(console.error);
