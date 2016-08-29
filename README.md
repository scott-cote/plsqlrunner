# plsqlrunner
PLSQLRunner is a development tool for PL/SQL that acts as an execution proxy. It sits between the browser and a PL/SQL web application. For requests served by PL/SQL packages it will extract the package from the database then compile and run it locally. For all other requests the assets will be requested from the server and forwarded to the browser. 
