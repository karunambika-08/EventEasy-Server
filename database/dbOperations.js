const { 
    DynamoDBClient,
    CreateTableCommand,
    ListTablesCommand
    } = require("@aws-sdk/client-dynamodb");

const {
    DynamoDBDocumentClient,  
    DeleteCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand
    } = require("@aws-sdk/lib-dynamodb") ;

const dynamodb = new DynamoDBClient({
    region: "local",
    endpoint: 'http://localhost:8000'
});
const docClient = DynamoDBDocumentClient.from(dynamodb);



let listTableinDB = async () => {
    let tablesInDB = new ListTablesCommand({});
    let response = await dynamodb.send(tablesInDB);
    let tableName = response.TableNames;
    return tableName;
}


/**
 * Function to create a new table if it not already exists
 * @param {*} tableName 
 * @param {*} params 
 * @returns 
 */
const createTable = async (tableName, params) => {
    try{
       let tablesList = await listTableinDB()
       let tablesExists = tablesList.includes(tableName)
       if(!tablesExists){
        const createCommand = new CreateTableCommand(params);
        const response = await dynamodb.send(createCommand);
        return response
       }else {
        console.log(`Table '${tableName}' already exists.`);
        return null;
    }
    }
    catch (error) {
        console.error('Error:', error);
        throw error; 
    }
}

/**
 * Function to add an item to the table
 * @param {*} tableName 
 * @param {*} params 
 * @returns 
 */
const addItemInTable = async (tableName,params)=>{
    try{
        let tablesList = await listTableinDB()
        let tablesExists = tablesList.includes(tableName);
        if(tablesExists){
            const addCommand = new PutCommand(params);
            const response = await docClient.send(addCommand);
            return response;
        }
    }
    catch(error){
        console.error('Error:', error);
        throw error; 
    }
    
}


/**
 * Function to scan items in the table
 * @param {*} scanParams 
 * @returns Matched Items in the table
 */
async function scanItemsinTable(scanParams) {
    let scanCommand =  new ScanCommand(scanParams);
    let response = await docClient.send(scanCommand)
    return response.Items;
} 



/**
 * Function to update an item in the table
 * @param {*} updateDataParams 
 * @returns response from the Db
 */
async function updateAnItemInTable(updateDataParams){
    let updateData = new UpdateCommand(updateDataParams);
    const response = await docClient.send(updateData);
    return response;
}


/**
 * Function to query items in the table based on the parameters passed in
 * @param {*} userParams 
 * @returns Response object from the DB
 */
async function queryItemsinTable(userParams){
    let queryItems = new QueryCommand(userParams)
    const response = await docClient.send(queryItems)
    return response;
}


/**
 * Function to delete items in the table based on the parameters passed in
 * @param {*} deleteUserData 
 * @returns Response object from the DB
 */
async function deleteAnItemInTable(deleteUserData){
    let deleteCommand = new DeleteCommand(deleteUserData);
    const response = await docClient.send(deleteCommand);
    return response;
}


module.exports = {
    addItemInTable,
    createTable,
    deleteAnItemInTable,
    queryItemsinTable,
    scanItemsinTable,
    updateAnItemInTable,
    };

