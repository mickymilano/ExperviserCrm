const fs = require('fs');

const debugEndpoint = `
// Endpoint temporaneo per il debug con query SQL dirette
app.post('/api/debug/query', authenticate, async (req, res) => {
  try {
    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query SQL richiesta' });
    }
    
    // Esegui query diretta al DB
    const result = await pool.query(query, params || []);
    
    res.json({
      count: result.rowCount,
      rows: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
`;

let routesContent = fs.readFileSync('server/routes.ts', 'utf8');
const insertPos = routesContent.indexOf('export async function registerRoutes');

if (insertPos !== -1) {
  routesContent = routesContent.slice(0, insertPos) + debugEndpoint + '\n' + routesContent.slice(insertPos);
  fs.writeFileSync('server/routes.ts', routesContent);
  console.log('Debug endpoint aggiunto con successo!');
} else {
  console.error('Impossibile trovare il punto di inserimento');
}
