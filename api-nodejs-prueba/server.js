const express = require('express')
const mysql = require('mysql2')
const myconn = require('express-myconnection')
const routes = require('./routes')

const app = express()
app.set('port', process.env.PORT || 9000)

const dbOptions = {
    host: 'localhost', 
    port: '3306', 
    user: 'root', 
    password: 'root123',
    database: 'store',
    connectionLimit: 10,
};

// middleware--------------------------
app.use(myconn(mysql, dbOptions, 'single'))
app.use(express.json())

// routes ------------------------------
app.get('/', (req, res) => {
    req.getConnection((err, connection) => {
      if (err) {
        console.error('Error al obtener la conexión:', err);
        res.status(500).send('Error de conexión');
        return;
      }
      connection.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
          console.error('Error en la consulta:', err);
          res.status(500).send('Error en la consulta');
          return;
        }
        res.send(`Resultado: ${results[0].solution}`);
      });
    });
  });

app.listen(3000, () => {
console.log('Servidor ejecutándose en http://localhost:3000');
});

app.use('/api', routes)

// server runnning-----------------------
app.listen(app.get('port'), () => 
    {console.log('server running on port', app.get('port'))
})