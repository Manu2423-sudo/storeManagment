-- Crear la base de datos
CREATE DATABASE STORE;
\c STORE;


CREATE TABLE products (
   productsId SERIAL PRIMARY KEY,
   productsName VARCHAR(100) NOT NULL, 
   productDesc VARCHAR(100) NOT NULL, 
   productCategory VARCHAR(100) NOT NULL, 
   productPrice DECIMAL(10,2) NOT NULL,
   productSku VARCHAR(100) UNIQUE NOT NULL 
);

CREATE TABLE inventory (
   inventoryId SERIAL PRIMARY KEY,
   productsId INT NOT NULL REFERENCES products(productsId),
   storeId VARCHAR(100) NOT NULL,
   quantity INTEGER NOT NULL, 
   minStock INTEGER NOT NULL
);

CREATE TABLE movement (
   movementId SERIAL PRIMARY KEY,
   productsId INT NOT NULL REFERENCES products(productsId),
   sourceStoreId VARCHAR(100) NOT NULL, 
   targetStoreId VARCHAR(100) NOT NULL, 
   quantity INTEGER NOT NULL,
   timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   type VARCHAR(10) CHECK (type IN ('IN', 'OUT', 'TRANSFER'))
);

/*------------------------------------------------------------------- Procedimientos almacenados ---------------------------------------------------------------------------------------*/
 
/*---------------------- Procedimientos almacenados para la gestion de productos ----------------------------------*/

/*Procedimiento almacenado Obtener productos*/

CREATE OR REPLACE FUNCTION GetProducts(
    p_category VARCHAR(100),
    p_min_price DECIMAL(10,2),
    p_max_price DECIMAL(10,2),
    p_min_stock INT,
    p_max_stock INT,
    p_page INT,
    p_limit INT
) RETURNS TABLE (
    productsId INT,
    productsName VARCHAR,
    productDesc VARCHAR,
    productCategory VARCHAR,
    productPrice DECIMAL,
    productSku VARCHAR,
    stock INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.*, COALESCE(i.quantity, 0) AS stock
    FROM products p
    LEFT JOIN inventory i ON p.productsId = i.productsId
    WHERE (p_category IS NULL OR p.productCategory = p_category)
      AND (p_min_price IS NULL OR p.productPrice >= p_min_price)
      AND (p_max_price IS NULL OR p.productPrice <= p_max_price)
      AND (p_min_stock IS NULL OR i.quantity >= p_min_stock)
      AND (p_max_stock IS NULL OR i.quantity <= p_max_stock)
    LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

 /*Procedimiento almacenado Obtener descripcion del producto por ID*/

CREATE OR REPLACE FUNCTION GetProductById(p_productId INT)
RETURNS TABLE (
    productsId INT,
    productsName VARCHAR,
    productDesc VARCHAR,
    productCategory VARCHAR,
    productPrice DECIMAL,
    productSku VARCHAR,
    stock INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.*, COALESCE(i.quantity, 0) AS stock
    FROM products p
    LEFT JOIN inventory i ON p.productsId = i.productsId
    WHERE p.productsId = p_productId;
END;
$$ LANGUAGE plpgsql;

 /*Procedimiento almacenado para registrar un nuevo producto*/

CREATE OR REPLACE FUNCTION CreateProduct(
    p_productsName VARCHAR(100),
    p_productDesc VARCHAR(100),
    p_productCategory VARCHAR(100),
    p_productPrice DECIMAL(10,2),
    p_productSku VARCHAR(100)
) RETURNS VOID AS $$
BEGIN
    IF p_productsName IS NULL OR p_productDesc IS NULL OR p_productCategory IS NULL OR p_productPrice IS NULL OR p_productSku IS NULL THEN 
        RAISE EXCEPTION 'Todos los campos son obligatorios';
    END IF;
    INSERT INTO products (productsName, productDesc, productCategory, productPrice, productSku)
    VALUES (p_productsName, p_productDesc, p_productCategory, p_productPrice, p_productSku);
END;
$$ LANGUAGE plpgsql;

/*Procedimiento almacenado para actualizar un producto*/

CREATE OR REPLACE FUNCTION UpdateProduct(
    p_productsId INT,
    p_productsName VARCHAR(100),
    p_productDesc VARCHAR(100),
    p_productCategory VARCHAR(100),
    p_productPrice DECIMAL(10,2),
    p_productSku VARCHAR(100)
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products WHERE productsId = p_productsId) THEN 
        RAISE EXCEPTION 'El producto no existe';
    END IF;
    
    IF p_productsName IS NULL OR p_productDesc IS NULL OR p_productCategory IS NULL OR p_productPrice IS NULL OR p_productSku IS NULL THEN 
        RAISE EXCEPTION 'Todos los campos son obligatorios';
    END IF;
    
    UPDATE products 
    SET productsName = p_productsName, 
        productDesc = p_productDesc, 
        productCategory = p_productCategory, 
        productPrice = p_productPrice, 
        productSku = p_productSku
    WHERE productsId = p_productsId;
END;
$$ LANGUAGE plpgsql;

/*Procedimiento almacenado para eliminar un producto*/

CREATE OR REPLACE FUNCTION DeleteProduct(p_productsId INT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products WHERE productsId = p_productsId) THEN
        RAISE EXCEPTION 'El producto no existe';
    END IF;
    DELETE FROM products WHERE productsId = p_productsId;
END;
$$ LANGUAGE plpgsql;

/*---------------------- Procedimientos almacenados para la gestion de stock ----------------------------------*/

/*Procedimiento almacenado para obtener el inventario de la tienda*/

CREATE OR REPLACE FUNCTION GetStoreInventory(p_storeId VARCHAR(100))
RETURNS TABLE (
    inventoryId INT,
    productsId INT,
    productsName VARCHAR,
    productCategory VARCHAR,
    productPrice DECIMAL,
    storeId VARCHAR,
    quantity INT,
    minStock INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.inventoryId, i.productsId, p.productsName, p.productCategory, p.productPrice, i.storeId, i.quantity, i.minStock
    FROM inventory i
    JOIN products p ON i.productsId = p.productsId
    WHERE i.storeId = p_storeId;
END;
$$ LANGUAGE plpgsql;

/*Procedimiento almacenado para hacer transferencias entre tiendas*/

CREATE OR REPLACE FUNCTION TransferProduct(
  p_productsId VARCHAR(100), 
  p_sourceStoreId VARCHAR(100),
  p_targetStoreId VARCHAR(100), 
  p_quantity INT
) RETURNS VOID AS $$
DECLARE 
   v_availableStock INT;
BEGIN 
   SELECT quantity INTO v_availableStock
   FROM inventory
   WHERE productsId = p_productsId AND storeId = p_sourceStoreId;
   
   IF v_availableStock IS NULL THEN 
      RAISE EXCEPTION 'El producto no existe en la tienda de origen';
   END IF;
   
   IF v_availableStock < p_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente en la tienda de origen';
   END IF;
   
   UPDATE inventory 
   SET quantity = quantity - p_quantity
   WHERE productsId = p_productsId AND storeId = p_sourceStoreId;
   
   IF EXISTS (SELECT 1 FROM inventory WHERE productsId = p_productsId AND storeId = p_targetStoreId) THEN
      UPDATE inventory 
      SET quantity = quantity + p_quantity
      WHERE productsId = p_productsId AND storeId = p_targetStoreId;
   ELSE
      INSERT INTO inventory (productsId, storeId, quantity, minStock)
      VALUES(p_productsId, p_targetStoreId, p_quantity, 0);
   END IF;
   
   INSERT INTO movement (productsId, sourceStoreId, targetStoreId, quantity, type)
   VALUES(p_productsId, p_sourceStoreId, p_targetStoreId, p_quantity, 'TRANSFER');
   
END $$ LANGUAGE plpgsql;

/*Procedimiento almacenado para obtener alertas de falta de stock*/

CREATE OR REPLACE FUNCTION GetLowStockAlerts()
RETURNS TABLE (
    inventoryId INT,
    productsId INT,
    productsName VARCHAR,
    productCategory VARCHAR,
    productPrice DECIMAL,
    storeId VARCHAR,
    quantity INT,
    minStock INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.inventoryId, i.productsId, p.productsName, p.productCategory, p.productPrice, i.storeId, i.quantity, i.minStock
    FROM inventory i
    JOIN products p ON i.productsId = p.productsId
    WHERE i.quantity <= i.minStock;
END;
$$ LANGUAGE plpgsql;