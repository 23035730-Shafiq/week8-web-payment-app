const express = require('express' ) ;
const mysql = require('mysql2/promise' );
require('dotenv').config();
const port = 3000;
const dbConfig = {
    host: process. env. DB_HOST,
    user: process.env.DB_USER,
    password: process. env. DB_PASSWORD,
    database: process.env. DB_NAME,
    port: process. env. DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};
const app = express();
app.use(express.json());
//Start the server
app.listen(port,()=>{
    console.log(`Server started on port ${port}`);
});
app.get('/payments', async (req, res) => {
    try {
        let connection = await mysql. createConnection(dbConfig);
        const [rows] = await connection. execute('SELECT * FROM defaultdb.payments');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res. status(500). json({ message: 'Server error for payments' });
    }
});
// POST add payment (Create)
app.post('/payments', async (req, res) => {
    const { amount, payment_status, payment_method } = req.body;

    if (amount === undefined || !payment_status || !payment_method) {
        return res.status(400).json({
            message: 'amount, payment_status, and payment_method are required',
        });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            'INSERT INTO payments (amount, payment_status, payment_method) VALUES (?, ?, ?)',
            [amount, payment_status, payment_method]
        );

        res.status(201).json({
            message: 'Payment added successfully',
            payment_id: result.insertId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not add payment', error: err.message });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT update payment by id (Update)
app.put('/payments/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, payment_status, payment_method } = req.body;

    if (amount === undefined || !payment_status || !payment_method) {
        return res.status(400).json({
            message: 'amount, payment_status, and payment_method are required',
        });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            'UPDATE payments SET amount = ?, payment_status = ?, payment_method = ? WHERE payment_id = ?',
            [amount, payment_status, payment_method, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No payment found with payment_id ${id}` });
        }

        res.json({ message: `Payment ${id} updated successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update payment', error: err.message });
    } finally {
        if (connection) await connection.end();
    }
});