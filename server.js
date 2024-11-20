const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');

const app = express();
app.use(bodyParser.json());

const config = {
    user: 'root',
    password: '123',
    server: 'localhost',
    port: 1433,
    database: 'TiendaOnline',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

sql.connect(config, err => {
    if (err) {
        console.log('Error al conectar a SQL Server:', err);
    } else {
        console.log('Conectado a SQL Server');
    }
});

app.get('/', (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>Servidor funcionando correctamente</h1>
                <button onclick="location.href='http://localhost:3000/cart-items'">Ver Carrito</button>
            </body>
        </html>
    `);
});

app.post('/add-to-cart', (req, res) => {
    const { name, quantity, price } = req.body;

    const query = `INSERT INTO CartItems (ProductName, Quantity, Price) VALUES ('${name}', ${quantity}, ${price})`;

    sql.query(query, (err, result) => {
        if (err) {
            console.log('Error al insertar en la base de datos:', err);
            res.status(500).send('Error al insertar en la base de datos');
        } else {
            res.status(200).send('Producto añadido al carrito');
        }
    });
});

app.get('/cart-items', (req, res) => {
    const query = 'SELECT *, Quantity * Price AS Total FROM CartItems';

    sql.query(query, (err, result) => {
        if (err) {
            console.log('Error al consultar la base de datos:', err);
            res.status(500).send('Error al consultar la base de datos');
        } else {
            const rows = result.recordset;
            let html = `<table border='1'>
                        <tr><th>Id</th><th>ProductName</th><th>Quantity</th><th>Price</th><th>Total</th><th>Acción</th></tr>`;
            
            rows.forEach(row => {
                html += `<tr>
                            <td>${row.Id}</td>
                            <td>${row.ProductName}</td>
                            <td>${row.Quantity}</td>
                            <td>${row.Price}</td>
                            <td>${row.Total}</td>
                            <td><button onclick="deleteItem(${row.Id})">Eliminar</button></td>
                         </tr>`;
            });

            html += `</table>`;
            html += `<button onclick="location.href='http://localhost:3000/'">Regresar</button>`;
            html += `<script>
                        function deleteItem(id) {
                            fetch('/delete-item', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ id: id })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    location.reload();
                                } else {
                                    alert('Error al eliminar el ítem');
                                }
                            });
                        }
                     </script>`;
            res.send(html);
        }
    });
});

app.post('/delete-item', (req, res) => {
    const { id } = req.body;

    const query = `DELETE FROM CartItems WHERE Id = ${id}`;

    sql.query(query, (err, result) => {
        if (err) {
            console.log('Error al eliminar el ítem de la base de datos:', err);
            res.status(500).json({ success: false });
        } else {
            res.status(200).json({ success: true });
        }
    });
});

app.post('/api/add-to-cart', (req, res) => {
    const { name, price, img, quantity } = req.body;

    const query = `INSERT INTO CartItems (ProductName, Price, Img, Quantity) VALUES ('${name}', ${price}, '${img}', ${quantity})`;

    sql.query(query, (err, result) => {
        if (err) {
            console.log('Error al insertar en la base de datos:', err);
            res.status(500).json({ success: false, message: 'Error al insertar en la base de datos' });
        } else {
            res.status(200).json({ success: true, message: 'Producto añadido al carrito' });
        }
    });
});

app.get('/api/cart-count', (req, res) => {
    const query = 'SELECT COUNT(*) AS count FROM CartItems';

    sql.query(query, (err, result) => {
        if (err) {
            console.log('Error al consultar la base de datos:', err);
            res.status(500).send('Error al consultar la base de datos');
        } else {
            res.status(200).json(result.recordset[0]);
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
