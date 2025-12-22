const express =require('express');
const mongoose = require('mongoose'); 
const bodyParser = require('body-parser')



let app =express(); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


//connect with data base in mongoAtlas 
let coonectDB = async function(){

    await mongoose.connect('mongodb+srv://menu:manarr@cluster0.mtex4ab.mongodb.net/gis',{
        
    })
    
}
coonectDB();
const carSchema = new mongoose.Schema({
    name : {
        type : String
    }, 
    year : {
        type : Number,
        index: true,

    },

    location: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
        },
        coordinates: {
         type : [Number],
          required: true
        },
      }  
})

let Car = mongoose.model('cars', carSchema)
carSchema.index({location: '2dsphere'});


app.post('/cars', async(req,res)=>{
    let newCar = await new Car(req.body).save()
    return res.status(201).json(newCar)
})

//buid end point to add new car with this attributes in data base 
//eg : find all cars in your data base 
//find nearst cars from your location 
//find the distance between 2 locatoins 




app.listen(8080,()=>{
    console.log('server now is working will')
})