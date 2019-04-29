const router = require('express').Router()
const bcrypt = require('bcryptjs')
const isEmail = require('validator/lib/isEmail')
const conn = require('../connection/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar

const {sendVerify} = require('../emails/nodeMailer') // verify for nodemailer

const uploadDir = path.join(__dirname + '/../uploads' )

const storagE = multer.diskStorage({
    // Destination
    destination : function(req, file, cb) {
        cb(null, uploadDir)
    },
    // Filename
    filename : function(req, file, cb) {
        cb(null, Date.now() + file.fieldname + path.extname(file.originalname))
    }
})

const upstore = multer ({
    storage: storagE,
    limits: {
        fileSize: 10000000 // Byte
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // will be error if the extension name is not one of these
            return cb(new Error('Please upload image file (jpg, jpeg, or png)')) 
        }

        cb(undefined, true)
    }
})

router.post('/upstore', upstore.single('avatar'), (req, res) => {
    const sql = `SELECT * FROM users WHERE username = ?`
    const sql2 = `UPDATE users SET avatar = '${req.file.filename}' WHERE username = ?`
    const data = req.body.uname

    console.log(data);
    
    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err)

        conn.query(sql2, data, (err , result) => {
            if (err) return res.send(err)
            
            res.send({filename: req.file.filename})
            
        })
    })
})

router.get('/delete', (req, res) => {
    const sql = `UPDATE users SET avatar = NULL WHERE username = ?`
    const sql2 = `SELECT * FROM users where username = ?`
    const data = req.body.username

    conn.query(sql2, data, (err, result)=> {
        if (err) return res.send(err)
        console.log(result[0].avatar)
        
        fs.unlink(`${uploadDir}/${result[0].avatar}`, function (err) {   
                    

            if (err) return res.send(err) 
                conn.query(sql, data, (err , result) => {
            if (err) return res.send(err)    
        })
             res.send({result : result[0],
                message: 'File Has been Deleted'
            }) 
                                        
        });                                  

        
    })   
})

// show avatar
router.get("/show/:avatar", (req, res) => {
    console.log(req.params.avatar);
    
    res.sendFile(`${uploadDir}/${req.params.avatar}`)
})
router.get("/users/avatar", (req, res)=> {
    const sql = `SELECT * FROM users WHERE username = ?`
    const data = req.body.uname

    conn.query(sql, data, (err, result)=>{
        if (err) return res.send(err);

        console.log(result[0].avatar);
        
        res.send({
            user: result[0],
            photo: `http://localhost:2010/show/${result[0].avatar}`
        })
    })
})

router.post('/users', async (req, res) => { // CREATE USER
    var sql = `INSERT INTO users SET ?;` // Tanda tanya akan digantikan oleh variable data
    var sql2 = `SELECT * FROM users;`
    var data = req.body // Object dari user {username, name, email, password}

    // validasi untuk email
    if(!isEmail(req.body.email)) return res.send("Email is not valid")
    // ubah password yang masuk dalam bentuk hash
    req.body.password = await bcrypt.hash(req.body.password, 8)

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.sqlMessage) // Error pada post data

        sendVerify(req.body.username, req.body.name, req.body.email)

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err) // Error pada select data

            res.send(result)
        })
    })
})

router.post('/users/login', (req, res) => {
    const {username, password} = req.body

    const sql = `UPDATE users SET verified = true WHERE username = '${username}'`
    const sql2 = `SELECT * from users where username = '${username}'`

    conn.query(sql, async (err, result) => {
        if(err) res.send(err)
        
        const user = result[0]
        
        if(!user) return res.send("USER NOT FOUND")

        if(!user.verified) return res.send("Please, verify your email")

        const hash = await  bcrypt.compare(password, user.password)

        if(!hash) res.send("Wrong Password")

    })
})


router.patch('/users/:userid', (req, res) => {  // UPDATE USERS

    const sql = `UPDATE users SET ? WHERE id = ?`
    const data = [req.body, req.params.userid]

    conn.query(sql, data, (err, result) => {
        if(err) res.send(err)

        res.send(result)
    })
})

router.get('/verify/:username', (req, res) => {
    const username = req.params.username
    const sql = `UPDATE users SET verified = true WHERE username = '${username}'`
    const sql2 = `SELECT * FROM users WHERE username = '${username}'`

    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err.sqlMessage)

            res.send('<h1>Verifikasi berhasil</h1>')
        })
    })
})



module.exports = router