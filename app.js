const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");

// const { verify } = require("crypto");




const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("views"));

//connecting to DB
mongoose.connect("mongodb://127.0.0.1:27017/areaDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to the DataBase.");
}).catch((err) => {
    console.log(err);
});

//creating a schema
const RestorentSchema = new mongoose.Schema({
    Name: String,
    Location: String,
    priceRating: Number,
    qualityRating: Number,
    can_refer: Boolean,
    is_veg: Boolean,
    imageUrl:String
}, { collection: "Restorent" });

const Userschema= new mongoose.Schema({
    UName:String,
    Pass:String
},{collection:"User"});
//creating a model

const Restorent = mongoose.model("Restorent", RestorentSchema);

const User=mongoose.model("User",Userschema);

app.get("/viewRestaurants", async (req, res) => {
    const filter={};
    if(req.query.is_veg==="true"){
        filter.is_veg=true
    }
    else if(req.query.is_veg==="false"){
        filter.is_veg=false
    }
    const result = await Restorent.find(filter);
    try {
        let output = `<head>
        <link rel="stylesheet" href="viewTab.css"></link>
        </head>
        <nav>
        <ul>
            <li><a href="/">HomePage</a></li>
            <li><a href="/viewRestaurants">viewRestorents</a></li>
            <li><a href="/insert_resto">AddReview</a></li>
             <li><a href="/Register_form">Register</a></li>
        </ul>
        </nav>
        <form action="/viewRestaurants" method="get">
        <label>Filter by Type:</label>
        <select name="is_veg" onchange="this.form.submit()">
        <option value="" ${!("is_veg" in req.query) || req.query.is_veg === "" ? "selected" : ""}>All</option>
        <option value="true" ${req.query.is_veg === "true" ? "selected" : ""}>Veg</option>
        <option value="false" ${req.query.is_veg === "false" ? "selected" : ""}>Non-Veg</option>
        </select>
        </form>
        <h1>Restorent's Details</h1>`
        output += `
        <table >
        <thead>
        <tr><td>Image</td><td>Name</td><td>Location</td><td>priceRating</td>
        <td>qualityRating</td><td>can_refer</td><td>is_Vegiterian</td><td colspan="2">Modify</td></tr>
        </thead>`;
        for (let obj of result) {
            output += `
            <tbody>
                  <tr>
                      <td><img src="${obj.imageUrl}" alt="Hotel Image" height="100" width="100"></td>
                      <td>${obj.Name}</td>
                      <td>${obj.Location}</td>
                      <td>${obj.priceRating}</td>
                      <td>${obj.qualityRating}</td>
                      <td>${obj.can_refer}</td>
                      <td>${obj.is_veg}</td>
                      <td>
                          <form action="/delete" method="post">
                               <input type="hidden" name="Name" value="${obj.Name}">
                               <input type="submit" id="bbtn" value="Delete">
                          </form>
                      </td>
                      <td>
                          <form action="/insert_resto" method="get" style="display:inline:">
                          <input type="hidden" name="edit" value="true">
                          <input type="hidden" name="Name" value="${obj.Name}">
                          <input type="hidden" name="Location" value="${obj.Location}">
                          <input type="hidden" name="priceRating" value="${obj.priceRating}">
                          <input type="hidden" name="qualityRating" value="${obj.qualityRating}">
                          <input type="hidden" name="can_refer" value="${obj.can_refer}">
                          <input type="hidden" name="is_veg" value="${obj.is_veg}">
                          <input type="submit" id="bbtn" value="Edit">
                          </form>
                      </td>
                  </tr>
            </tbody>`;
        }
        output += "</table>";
        res.send(output);
    }
    catch (err) {
        res.send(err);
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/insert_resto", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "insertHotel.html"));
});
app.post("/add", async (req, res) => {
    const Name = req.body.HName;
    const Location = req.body.Location;
    const priceRating = Number(req.body.rating);
    const qualityRating = Number(req.body.qRating);
    const can_refer = (req.body.canref === 'true');
    const is_veg = (req.body.veg === 'true');
    const imageUrl = req.body.imageUrl;
    // console.log("Incoming Data:", req.body);


    try {
        const existing= await Restorent.findOne({Name,Location});
        if(existing){
            res.send("Restorent with the same name and location already exists!");
            return;
        }
        const doc = new Restorent({
            Name, Location, priceRating, qualityRating, can_refer, is_veg,imageUrl
        });
        await doc.save();
        res.send("saved!");
    }
    catch (err) {
        res.send(err);
    }
});
app.post("/edit", async (req, res) => {
    const Name = req.body.HName;
    const Location = req.body.Location;
    const priceRating = Number(req.body.rating);
    const qualityRating = Number(req.body.qRating);
    const can_refer = (req.body.canref === 'true');
    const is_veg = (req.body.veg === 'true');
    const imageUrl=req.body.imageUrl;

    try {
        const result = await Restorent.updateOne(
            { Name: Name, Location: Location }
            , { $set: { qualityRating, is_veg, priceRating, can_refer,imageUrl } }
        );
        if (result.matchedCount === 0) {
            res.send("No matching restaurant found to update");
        }
        else if (result.modifiedCount === 0) {
            res.send("Restaurant found but no data was changed.");
        }
        else {
            res.send("Updated successfully!");
        }
    }
    catch (err) {
        res.send(err.message);
    }
});
app.post("/delete", async (req, res) => {
    const Name = req.body.Name;
    try {
        const result = await Restorent.deleteOne({ Name });
        res.redirect("/viewRestaurants")
    }
    catch (err) {
        res.send(err);
    }
});
app.get("/Register_form", (req,res)=>{
    res.sendFile(path.join(__dirname,"views","Register.html"));
});
app.post("/Register", async (req,res)=>{
    const UName=req.body.uname;
    const Pass=req.body.upass;
    // res.send("uname:"+uname+"upass"+upass);
    try{
        const exist=await User.find({UName,Pass});
        if(exist.length>0){
            res.send("This username and password already exists");
            return;
        }
        const user=new User({
            UName,Pass
        });
        await user.save();
        res.send("Data Registerd!");
    }
    catch(err){
        res.send("error");
    }

});
app.get("/login_form", (req,res)=>{
    res.sendFile(path.join(__dirname,"views","login.html"));
})
app.post("/login", async (req,res)=>{
    const UName=req.body.uname;
    const Pass= req.body.upass;
    // console.log(UName,Pass);
    const exists= await User.findOne({UName,Pass});
    if(exists){
        // res.send("login successfull !");
        res.redirect("/");
    }
    else{
        res.send("User Not Found!");
    }
});
app.listen(3000);




