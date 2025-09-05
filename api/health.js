export default async function handler(req, res){
  const cfg = {
    endpoint: process.env.DATA_API_ENDPOINT || null,
    database: process.env.DATA_API_DATABASE || null,
    collection: process.env.DATA_API_COLLECTION || 'notes',
    datasource: process.env.DATA_API_DATASOURCE || 'mongodb-atlas',
    // do not return key
  };
  // quick sanity: endpoint should contain region and /endpoint/data/v1/
  const endpointOk = cfg.endpoint && /data\.mongodb-api\.com\/app\/.+\/endpoint\/data\/v1\/?$/i.test(cfg.endpoint);
  const result = { ok: true, endpointOk, cfg };
  try{
    if(endpointOk){
      const url = new URL('action/find', cfg.endpoint).toString();
      const body = {
        dataSource: cfg.datasource,
        database: cfg.database,
        collection: cfg.collection,
        limit: 0
      };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.DATA_API_KEY || '' },
        body: JSON.stringify(body)
      });
      const text = await r.text();
      result.dataApiStatus = r.status;
      // try JSON parse, else include truncated text
      try{ result.dataApiBody = JSON.parse(text); }
      catch{ result.dataApiBody = text.slice(0, 300); }
    }
  }catch(e){
    result.ok = false;
    result.error = e.message;
  }
  res.status(200).json(result);
}
