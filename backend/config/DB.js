const mongoose=require("mongoose")
const DB="mongodb+srv://ranvishwakarma122:nNjOcMP7oTBVqWVK@cluster0.cbs5t.mongodb.net/osm"
const Collection=async()=>{
    try {
        await mongoose.connect(DB)
        console.log("DB connected")
    } catch (error) {
        console.log("Something wrong")
    }
}
module.exports=Collection