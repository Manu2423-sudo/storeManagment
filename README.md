API Documentation

Descripción

Esta API fue desarrollada utilizando Node.js, Express, y PostgreSQL. Su propósito es gestionar productos, inventarios y movimientos de productos entre tiendas.

Instrucciones de Instalación

Requisitos Previos

Node.js: Instale Node.js desde Node.js Official Website.

PostgreSQL: Instale PostgreSQL desde PostgreSQL Official Website.

Git: Asegúrese de tener Git instalado para clonar el repositorio.

Pasos para la Instalación

Clone el repositorio:

git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio

Instale las dependencias:

npm install

Configure las variables de entorno:
Cree un archivo .env en la raíz del proyecto y configure las siguientes variables:

DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_base_datos
PORT=3000

Cree la base de datos y las tablas necesarias:
Ejecute los scripts de creación de tablas y procedimientos almacenados proporcionados en el archivo database/init.sql.

Inicie el servidor:

npm start

El servidor estará disponible en http://localhost:3000.

Documentación de la API

Endpoints

Productos

GET /api/products

Descripción: Obtiene todos los productos con filtros opcionales.

Parámetros opcionales:

category: Filtra por categoría.

minPrice: Precio mínimo.

maxPrice: Precio máximo.

Respuesta:

[
  {
    "productsId": 1,
    "productsName": "Laptop",
    "productCategory": "Electronics",
    "productPrice": 1200.99
  }
]

POST /api/products

Descripción: Crea un nuevo producto.

Cuerpo de solicitud:

{
  "productsName": "Laptop",
  "productDesc": "Laptop de alta gama",
  "productCategory": "Electronics",
  "productPrice": 1500.50,
  "productSku": "ABC123"
}

PUT /api/products/:id

Descripción: Actualiza un producto existente.

Cuerpo de solicitud:

{
  "productsName": "Tablet",
  "productDesc": "Tablet actualizada",
  "productCategory": "Electronics",
  "productPrice": 800.99,
  "productSku": "DEF456"
}

DELETE /api/products/:id

Descripción: Elimina un producto existente.

Inventario

GET /api/inventory/:storeId

Descripción: Obtiene el inventario de una tienda.

POST /api/inventory/transfer

Descripción: Transfiere productos entre tiendas.

Cuerpo de solicitud:

{
  "productsId": "123",
  "sourceStoreId": "STORE001",
  "targetStoreId": "STORE002",
  "quantity": 10
}

GET /api/alerts/low-stock

Descripción: Obtiene productos con bajo stock.

Decisiones Técnicas

Base de datos PostgreSQL:

Elegida por su robustez, soporte a procedimientos almacenados y capacidad para manejar relaciones complejas.

Express:

Framework minimalista para Node.js que facilita la creación de APIs RESTful.

Procedimientos almacenados:

Se optó por mover la lógica de negocio crítica a la base de datos para mejorar el rendimiento y garantizar la consistencia de los datos.

Gestión de errores:

Errores SQL se manejan utilizando SIGNAL en PostgreSQL y son convertidos a respuestas HTTP con códigos específicos.

Arquitectura modular:

Cada recurso (productos, inventarios, movimientos) tiene rutas y controladores separados para facilitar el mantenimiento y escalabilidad.

Diagrama de Arquitectura

graph TD
    Client -->|HTTP Requests| API[Node.js / Express API]
    API -->|Queries| DB[PostgreSQL Database]
    API -->|Business Logic| Procedures[Stored Procedures]
    DB -->|Data| Tables[Products, Inventory, Movement]

Contribuciones

Las contribuciones son bienvenidas. Por favor, abra un pull request o informe problemas en el repositorio.

Licencia

Este proyecto está bajo la Licencia MIT. Consulte el archivo LICENSE para más detalles.
