/* Validated BeanFlow results (synthetic data, 2026-09-25 to 2026-10-01).
   Source: retail-analytics-platform/docs/insights.md */
window.BEANFLOW = {
  daily: [
    { date: '2026-09-25', sales: 727312.32, tx: 2494, aov: 291.62, ads: 6324.45 },
    { date: '2026-09-26', sales: 821418.08, tx: 2617, aov: 313.88, ads: 7142.77 },
    { date: '2026-09-27', sales: 734005.44, tx: 2400, aov: 305.84, ads: 6382.66 },
    { date: '2026-09-28', sales: 698090.40, tx: 2309, aov: 302.33, ads: 6070.35 },
    { date: '2026-09-29', sales: 684010.85, tx: 2349, aov: 291.19, ads: 5947.92 },
    { date: '2026-09-30', sales: 790964.94, tx: 2648, aov: 298.70, ads: 6877.96 },
    { date: '2026-10-01', sales: 749544.08, tx: 2524, aov: 296.97, ads: 6517.77 }
  ],

  dailyMetrics: {
    sales: { label: 'Sales', sub: 'Sales per business day (₱)', format: 'compact' },
    tx:    { label: 'Orders', sub: 'Completed orders per business day', format: 'int' },
    aov:   { label: 'AOV', sub: 'Average order value: sales ÷ orders (₱)', format: 'dec' },
    ads:   { label: 'ADS', sub: 'Average daily sales per open store (₱)', format: 'int' }
  },

  regions: [
    { name: 'Metro Manila',       sales: 2448210.11, storeDays: 350, ads: 6994.89, adq: 41.47 },
    { name: 'South Luzon',        sales: 1225068.41, storeDays: 203, ads: 6034.82, adq: 36.00 },
    { name: 'Visayas & Mindanao', sales: 900885.21,  storeDays: 140, ads: 6434.89, adq: 37.53 },
    { name: 'North Luzon',        sales: 631182.38,  storeDays: 112, ads: 5635.56, adq: 32.80 }
  ],

  regionMetrics: {
    sales: {
      label: 'Sales', sub: 'Total sales by region (₱)', format: 'compact',
      insight: 'South Luzon sells more than Visayas & Mindanao in total, but only because it has more stores open.'
    },
    ads: {
      label: 'ADS', sub: 'Average daily sales per open store (₱)', format: 'int',
      insight: 'Per store-day, Visayas & Mindanao outperforms South Luzon. Normalizing by store-days changes the ranking.'
    },
    adq: {
      label: 'ADQ', sub: 'Average daily units sold per open store', format: 'dec',
      insight: 'Metro Manila leads on volume per store too. North Luzon trails on every normalized measure.'
    }
  },

  pipeline: [
    {
      id: 'source', name: 'PostgreSQL POS', tag: 'Source',
      title: 'Operational source system',
      body: 'A Python simulator generates a 120-store, 4-region coffee business into PostgreSQL 16: stores, products, customers, promotions, orders, items and payments. Records are mutable, so the pipeline has to handle late updates.',
      points: ['10 normalized tables with constraints and triggers', 'Deterministic, seeded data generation', 'Mutations that exercise incremental logic']
    },
    {
      id: 'extract', name: 'Python EL', tag: 'Ingestion',
      title: 'Incremental extraction',
      body: 'Full and incremental modes. Mutable tables are extracted on updated_at with windows that deliberately overlap the previous run, so nothing updated late is ever skipped.',
      points: ['Overlapping, replay-safe windows', 'Schema contracts per table in YAML', 'Row-count reconciliation after every load']
    },
    {
      id: 'landing', name: 'Parquet', tag: 'Landing',
      title: 'Durable landing layer',
      body: 'Every extraction is written to date-partitioned Parquet before the warehouse load. Extraction is decoupled from loading, and the full history survives on BigQuery Sandbox.',
      points: ['Partitioned by extraction date', 'Typed schemas enforced at write', 'Re-loadable without re-extracting']
    },
    {
      id: 'bronze', name: 'BigQuery Bronze', tag: 'Warehouse',
      title: 'Raw, append-only warehouse layer',
      body: 'Raw data lands in raw_pos with ingestion metadata. Replay copies from overlapping windows are kept on purpose: deduplication is a business rule and belongs in dbt.',
      points: ['Source columns preserved as-is', 'Ingestion metadata on every row', 'Least-privilege IAM service accounts']
    },
    {
      id: 'dbt', name: 'dbt', tag: 'Transform',
      title: 'Silver → Intermediate → Gold → Marts',
      body: '30 dbt models. Silver dedupes on primary key + updated_at. Intermediate rebuilds SCD Type 2 history and a store-day calendar spine. Gold holds the star schema of 6 dimensions and 4 facts.',
      points: ['SCD Type 2 with point-in-time joins', '239 data tests, including reconciliations', 'PASS=269 · WARN=0 · ERROR=0']
    },
    {
      id: 'bi', name: 'Metabase', tag: 'BI',
      title: 'Self-service dashboards',
      body: 'Five business marts feed three Metabase dashboards: Executive Overview, Store Performance, and Product & Customer Analytics, including cohort retention and RFM segmentation.',
      points: ['Read-only BigQuery service account', 'Filters by date, region, area, store', 'KPI definitions documented and tested']
    }
  ],

  gallery: {
    exec: [
      { src: 'assets/img/executive-overview-1.png', w: 1010, h: 837, caption: 'Executive Overview: headline KPIs, daily sales and orders, and ADS vs ADQ.' },
      { src: 'assets/img/executive-overview-2.png', w: 849, h: 273, caption: 'Executive Overview: gross margin trend by business day.' }
    ],
    store: [
      { src: 'assets/img/store-performance-1.png', w: 994, h: 814, caption: 'Store Performance: KPI tiles, then sales, ADS and ADQ by region.' },
      { src: 'assets/img/store-performance-2.png', w: 838, h: 797, caption: 'Store Performance: top 10 stores, sales by store type, and regional margin and trend.' },
      { src: 'assets/img/store-performance-3.png', w: 763, h: 355, caption: 'Store Performance: detail table for all 115 stores.' }
    ],
    product: [
      { src: 'assets/img/product-customer-analytics-1.png', w: 972, h: 819, caption: 'Product Performance: units, sales, margin and top products by category.' },
      { src: 'assets/img/product-customer-analytics-2.png', w: 953, h: 372, caption: 'Customer Retention: cohort retention matrix and cohort sizes.' },
      { src: 'assets/img/product-customer-analytics-3.png', w: 939, h: 512, caption: 'Customer RFM: customers and sales by RFM segment.' }
    ]
  }
};
