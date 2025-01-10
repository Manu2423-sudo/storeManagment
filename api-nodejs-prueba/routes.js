const express = require('express')
const routes = express.Router()

routes.get('/products', (req, res) => {
    const {
        category,
        minPrice,
        maxPrice,
        minStock,
        maxStock,
        page,
        limit,
    } = req.query;

    
    const p_category = category || null;
    const p_min_price = minPrice ? parseFloat(minPrice) : null;
    const p_max_price = maxPrice ? parseFloat(maxPrice) : null;
    const p_min_stock = minStock ? parseInt(minStock) : null;
    const p_max_stock = maxStock ? parseInt(maxStock) : null;
    const p_page = page ? parseInt(page) : 1; // Página por defecto: 1
    const p_limit = limit ? parseInt(limit) : 10; // Límite por defecto: 10

    req.getConnection((err, conn) => {
        if (err) return res.status(500).send({ error: 'Error al conectar con la base de datos', details: err });

        conn.query(
            `CALL GetProducts(?, ?, ?, ?, ?, ?, ?)`,
            [p_category, p_min_price, p_max_price, p_min_stock, p_max_stock, p_page, p_limit],
            (err, results) => {
                if (err) return res.status(500).send({ error: 'Error al ejecutar el procedimiento almacenado', details: err });

                res.status(200).json(results[0]);
            }
        );
    });
});

routes.get('/products/:id', (req, res) => {
    const { id } = req.params;

    const productId = parseInt(id);
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'El ID del producto debe ser un número positivo' });
    }

    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL GetProductDetails(?)`,
            [productId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                // Verificar si se encontró el producto
                if (!results[0] || results[0].length === 0) {
                    return res.status(404).json({ error: 'Producto no encontrado' });
                }

                res.status(200).json(results[0][0]);
            }
        );
    });
});

routes.post('/registerProducts', (req, res) => {
    const {
        productsName,
        productDesc,
        productCategory,
        productPrice,
        productSku
    } = req.body;

    
    if (!productsName || !productDesc || !productCategory || !productPrice || !productSku) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL CreateProduct(?, ?, ?, ?, ?)`,
            [productsName, productDesc, productCategory, parseFloat(productPrice), productSku],
            (err, results) => {
                if (err) {
                    if (err.sqlState === '45000') {
                        return res.status(400).json({ error: err.sqlMessage });
                    }
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                res.status(201).json({ message: 'Producto creado exitosamente' });
            }
        );
    });
});

routes.put('/editProducts/:id', (req, res) => {
    const { id } = req.params;
    const {
        productsName,
        productDesc,
        productCategory,
        productPrice,
        productSku
    } = req.body;

    
    const productId = parseInt(id);
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'El ID del producto debe ser un número positivo' });
    }

    
    if (!productsName || !productDesc || !productCategory || !productPrice || !productSku) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL UpdateProduct(?, ?, ?, ?, ?, ?)`,
            [productId, productsName, productDesc, productCategory, parseFloat(productPrice), productSku],
            (err, results) => {
                if (err) {
                    // Manejo de errores específicos para el procedimiento almacenado
                    if (err.sqlState === '45000' || err.sqlState === '45001') {
                        return res.status(400).json({ error: err.sqlMessage });
                    }
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                res.status(200).json({ message: 'Producto actualizado exitosamente' });
            }
        );
    });
});

routes.delete('/deleteProducts/:id', (req, res) => {
    const { id } = req.params;

    const productId = parseInt(id);
    if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'El ID del producto debe ser un número positivo' });
    }

    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL DeleteProduct(?)`,
            [productId],
            (err, results) => {
                if (err) {
                    if (err.sqlState === '45001') {
                        return res.status(404).json({ error: err.sqlMessage });
                    }
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                res.status(200).json({ message: 'Producto eliminado exitosamente' });
            }
        );
    });
});

routes.get('/inventory/:storeId', (req, res) => {
    const { storeId } = req.params;

    
    if (!storeId) {
        return res.status(400).json({ error: 'El ID de la tienda es obligatorio' });
    }

    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL GetStoreInventory(?)`,
            [storeId],
            (err, results) => {
                if (err) {
                    
                    if (err.sqlState === '45002') {
                        return res.status(404).json({ error: err.sqlMessage });
                    }
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                
                res.status(200).json(results[0]);
            }
        );
    });
});

routes.post('/products/transfer', (req, res) => {
    const { productsId, sourceStoreId, targetStoreId, quantity } = req.body;

    
    if (!productsId || !sourceStoreId || !targetStoreId || !quantity) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios: productsId, sourceStoreId, targetStoreId, quantity' });
    }

    
    const transferQuantity = parseInt(quantity);
    if (isNaN(transferQuantity) || transferQuantity <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser un número positivo' });
    }

    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL TransferProduct(?, ?, ?, ?)`,
            [productsId, sourceStoreId, targetStoreId, transferQuantity],
            (err, results) => {
                if (err) {
                    
                    if (err.sqlState === '45003') {
                        return res.status(404).json({ error: 'El producto no existe en la tienda de origen' });
                    }
                    if (err.sqlState === '45004') {
                        return res.status(400).json({ error: 'Stock insuficiente en la tienda de origen' });
                    }
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                // Responder con éxito
                res.status(200).json({ message: 'Transferencia realizada exitosamente' });
            }
        );
    });
});

routes.get('/alerts/low-stock', (req, res) => {
    req.getConnection((err, conn) => {
        if (err) {
            return res.status(500).json({ error: 'Error al conectar con la base de datos', details: err });
        }

        conn.query(
            `CALL GetLowStockAlerts()`,
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado', details: err });
                }

                // Enviar los productos con bajo stock
                res.status(200).json(results[0]);
            }
        );
    });
});

routes.post('/', (req, res)=> {
    req.getConnection((err, conn) =>{
        if(err) return res.send(err)
        //console.log(req.body)         
        conn.query('INSERT INTO products set ?', [req.body],  (err, rows) => {
            if(err) return res.send(err)
            
                res.send('Product register succesfully')
        })
    })
})

module.exports = routes