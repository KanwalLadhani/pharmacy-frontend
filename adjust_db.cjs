const mysql = require('mysql2/promise');

async function adjustDB() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1240722',
    database: 'pharmacy_db'
  });
  
  console.log("Connected to MySQL.");
  
  const [rows] = await connection.execute('SELECT * FROM medicines');
  console.log(`Found ${rows.length} medicines. Updating quantities...`);
  
  for (let m of rows) {
    if (!m.price || !m.quantity) continue;
    const price = parseFloat(m.price);
    let newQty = m.quantity;
    
    if (price > 5000) newQty = Math.min(newQty, 2);
    else if (price > 1000) newQty = Math.min(newQty, 5);
    else if (price > 500) newQty = Math.min(newQty, 15);
    else newQty = Math.min(newQty, 25);
    
    if (newQty !== m.quantity) {
      await connection.execute('UPDATE medicines SET quantity = ? WHERE brand_id = ?', [newQty, m.brand_id]);
    }
  }
  
  const [sumRow] = await connection.execute('SELECT SUM(price * quantity) as total FROM medicines');
  console.log(`Updated! New Total Valuation: PKR ${sumRow[0].total}`);
  
  await connection.end();
}

adjustDB().catch(console.error);
