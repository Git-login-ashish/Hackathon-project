require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const encrypt = require('bcryptjs');

const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME

});

connection.connect((err)=> {
    if(err) {
        console.error('Error connecting to MySQL :',err.stack);
        return;
    }
    console.log('Connected to MySQL as ID : ',connection.threadId);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/employees', (req, res) => {
    const query = 'SELECT * FROM employees';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error with MySQL query:', err);
            return res.status(500).send('Database query error');
        }
        res.status(200).json(results);
    });
});

app.post('/api/register', async (req,res) => {
    const {name,email,password} = req.body;

    connection.query('SELECT * FROM employees WHERE email = ?',[email],async(err,results) => {
        if (err) {
            console.error('Error in MySQL query :',err);
            return res.status(500).send('Database query error');
        }
        if(results.length > 0) {
            return res.status(400).json({message: 'Email already exists'});
        }

        const hashedPassword = await encrypt.hash(password,10);

        const query = 'INSERT INTO employees (name,email,password) VALUES (?,?,?)';
        connection.query(query,[name,email,hashedPassword],(err,result) => {
            if (err) {
                console.error('Error with MySQL query:',err);
                return res.status(500).send('Database query error');
            }
            res.status(201).json({message: 'Employee registered successfully'});

        });
    });
});

app.get('/api/employees/:empId', (req, res) => {
    const empId = req.params.empId; 
    
    connection.query('SELECT * FROM employees WHERE empId = ?', [empId], (err, results) => {
        if (err) {
            console.error('Error with MySQL query:', err);
            return res.status(500).send('Database query error');
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(results[0]);
    });
});

app.delete('/api/employees/:empId', (req, res) => {
    const empId = req.params.empId;  
    
    connection.query('DELETE FROM employees WHERE empId = ?', [empId], (err, results) => {
        if (err) {
            console.error('Error with MySQL query:', err);
            return res.status(500).send('Database query error');
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee deleted successfully' });
    });
});


app.post('/api/credits/add', (req, res) => {
    const { credits } = req.body; 

    if (!credits || isNaN(credits) || credits <= 0) {
        return res.status(400).json({ message: 'Invalid credits value' });
    }

    connection.query(
        'UPDATE employees SET balance = balance + ?',
        [credits],
        (err, results) => {
            if (err) {
                console.error('Error with MySQL query:', err);
                return res.status(500).send('Database query error');
            }

            res.status(200).json({
                message: `${credits} credits added to all employees`,
                affectedRows: results.affectedRows
            });
        }
    );
});


app.get('/api/vendors', (req, res) => {
    const query = 'SELECT * FROM vendors';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error with MySQL query:', err);
            return res.status(500).send('Database query error');
        }
        res.status(200).json(results);
    });
});

app.post('/api/vendors', (req, res) => {
    const { name, contact_info } = req.body;

    const query = 'INSERT INTO vendors (name, contact_info) VALUES (?, ?)';
    connection.query(query, [name, contact_info], (err, result) => {
        if (err) {
            console.error('Error with MySQL query:', err);
            return res.status(500).send('Database query error');
        }
        res.status(201).json({ message: 'Vendor added successfully' });
    });
});

app.delete('/api/vendors/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM vendors WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error with MySQL query:', err);
            return res.status(500).send('Database query error');
        }
        res.status(200).json({ message: 'Vendor deleted successfully' });
    });
});


app.get('/',(req,res) => {
    connection.query('SELECT NOW()',(err,results) => {
        if(err) {
            console.error('Error with the MySQL query:',err);
            return res.status(500).send('Database query error');
        }
        res.send(`Current time from MySQL: ${results[0]['NOW()']}`);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});