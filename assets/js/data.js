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
      title: 'Self-service dashboards, built as code',
      body: 'Five business marts feed three Metabase dashboards: Executive Overview, Store Performance, and Product & Customer Analytics, including cohort retention and RFM segmentation. A script builds all 42 questions, filters and layouts through the Metabase API.',
      points: ['Read-only BigQuery service account', 'Filters by date, region, area, store type and store', 'Totals reconcile with the validated KPIs']
    }
  ],

  gallery: {
    exec: [
      { src: 'assets/img/executive-overview-1.png', w: 1100, h: 839, caption: 'Executive Overview: one row of headline KPIs, daily sales and transactions, and daily ADS and ADQ.' },
      { src: 'assets/img/executive-overview-2.png', w: 1100, h: 289, caption: 'Executive Overview: gross margin % by day and sales by day of week.' }
    ],
    store: [
      { src: 'assets/img/store-performance-1.png', w: 1100, h: 885, caption: 'Store Performance: raw regional sales next to ADS per open store-day, top 10 stores by sales and bottom 10 by ADS.' },
      { src: 'assets/img/store-performance-2.png', w: 1100, h: 612, caption: 'Store Performance: ADS by store type, gross margin % by region and daily ADS by region.' },
      { src: 'assets/img/store-performance-3.png', w: 1100, h: 473, caption: 'Store Performance: scorecard for all 115 stores with sales, AOV, ADS, ADQ and margin %.' }
    ],
    product: [
      { src: 'assets/img/product-customer-analytics-1.png', w: 1100, h: 976, caption: 'Products: units, sales, margin and selling price, top products, and sales and margin by category.' },
      { src: 'assets/img/product-customer-analytics-2.png', w: 1100, h: 796, caption: 'Customers: RFM segments, cohort retention and spend by loyalty tier.' }
    ]
  }
};

/* PourStream results (synthetic data, default seed, 1–7 Oct 2026).
   Source: pourstream-event-pipeline README "Sample run". */
window.POURSTREAM = {
  pipeline: [
    {
      id: 'ps-sim', name: 'Event simulator', tag: 'Source',
      title: 'Ordering sessions with realistic faults',
      body: 'A seeded simulator generates app, web and kiosk ordering sessions for 12 stores and sends them in arrival order, like a real broker would see them. It injects the faults a real stream has: client retries, phones that buffer events offline, and broken payloads.',
      points: ['~29.6k messages per simulated week', '1.8% duplicates · 3% late · 0.5% malformed', 'Deterministic per seed, so tests can check exact totals']
    },
    {
      id: 'ps-kafka', name: 'Redpanda', tag: 'Broker',
      title: 'Kafka-compatible event stream',
      body: 'Events go to a 3-partition topic keyed by session, so each session stays in order. The producer is idempotent. A file-backed broker with the same semantics lets the whole pipeline run offline and in CI.',
      points: ['Kafka API through confluent-kafka', 'Keyed partitioning keeps per-session order', 'Redpanda Console for inspecting topics']
    },
    {
      id: 'ps-loader', name: 'Python loader', tag: 'Ingestion',
      title: 'Contract-validated micro-batches',
      body: 'The loader polls batches, validates every message against a Pydantic data contract, and commits offsets only after the batch is safely written. A crash replays the batch, and the duplicates are removed downstream.',
      points: ['At-least-once delivery, exactly-once results', 'Rejects typed as invalid_json, schema_violation or future_timestamp', 'Dead-letter queue keeps the raw payload for replay']
    },
    {
      id: 'ps-lake', name: 'Parquet lake', tag: 'Bronze',
      title: 'Append-only bronze layer',
      body: 'Valid events and dead letters land as Parquet files, one per micro-batch, partitioned by ingest date. Files are written atomically, so readers never see a half-written batch.',
      points: ['zstd-compressed Parquet', 'Kafka partition and offset kept on every row', 'Nothing is deleted or rewritten in bronze']
    },
    {
      id: 'ps-dbt', name: 'dbt + DuckDB', tag: 'Transform',
      title: 'Silver dedupe, late-data-aware gold',
      body: 'Silver keeps the first delivery of each event_id. The incremental order fact rebuilds every order touched by newly arrived events from all of its events, so a payment that arrives six hours late corrects the order instead of being dropped.',
      points: ['12 models, 35 data tests', 'Incremental = full refresh, proven by a test', 'PASS=49 · WARN=0 · ERROR=0']
    },
    {
      id: 'ps-bi', name: 'Metabase', tag: 'BI',
      title: 'Dashboards built as code',
      body: 'Gold marts are published to a Postgres serving database, and a script builds three Metabase dashboards through the API: Store Operations, Customer Funnel & Menu, and Stream Health.',
      points: ['28 questions with linked Date, Region, Store and Channel filters', 'Postgres serving layer, so BI never locks the warehouse', 'Rebuilt from code, so dashboards are reviewable in git']
    }
  ],

  gallery: {
    ops: [
      { src: 'assets/img/pourstream-store-operations-1.png', w: 1100, h: 977, caption: 'Store Operations: KPIs, daily revenue, orders by hour, prep-time SLA breaches by store and cancellations.' },
      { src: 'assets/img/pourstream-store-operations-2.png', w: 1100, h: 520, caption: 'Store Operations: scorecard for all 12 stores. Kiosk stores miss the 10-minute prep SLA about 4× as often.' }
    ],
    funnel: [
      { src: 'assets/img/pourstream-customer-funnel-menu-1.png', w: 1100, h: 884, caption: 'Customer Funnel: session to pickup funnel, conversion by channel and by day.' },
      { src: 'assets/img/pourstream-customer-funnel-menu-2.png', w: 1100, h: 842, caption: 'Menu: top items, units by category and item cart-to-order conversion.' }
    ],
    health: [
      { src: 'assets/img/pourstream-stream-health-1.png', w: 1100, h: 930, caption: 'Stream Health: messages by outcome, late events, and dead letters by error type.' },
      { src: 'assets/img/pourstream-stream-health-2.png', w: 1100, h: 427, caption: 'Stream Health: daily duplicates, late events, dead letters and arrival lag.' }
    ]
  }
};
