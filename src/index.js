const express = require('express')
const userRouter = require('./routers/userRouter')

const app = express()
const port = process.env.PORT // akses dari enviroment

app.use(express.json())
app.use(userRouter)

app.get('/', (req, res) => {
    res.send(`<h1> API RUNING ON HEROKU PORT ${port} </h1>`)
})


app.listen(port, () => {
    console.log("Running at ", port);
    
})


// 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
// code API
