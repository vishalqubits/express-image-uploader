import express from "express";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from "@prisma/client";

const cors = require("cors");

const multer = require("multer");
const fs = require("fs");

const app = express();

const prisma = new PrismaClient();

const corsOptions = {
  origin: "http://localhost:3000", // Specify the allowed origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow credentials (e.g., cookies) to be sent with the request
};

// Use CORS middleware
app.use(cors(corsOptions));

// body parser is required for post api to get data in request
//Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// read .env file with configuration
dotenv.config();

const port = 3001;

var storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, "./public/uploads");
  },
  filename: function (req: any, file: any, cb: any) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

// create s3 client using your credentials
const s3 = new S3Client({
  region: process.env.S3_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

app.get("/", (req, res) => {
  res.json({
    message: "Hello World",
  });
});

app.post(
  "/profile-upload-single",
  upload.single("profile-file"),
  async function (req, res, next) {
    // req.file is the `profile-file` file
    // req.body will hold the text fields, if there were any
    console.log(JSON.stringify(req.file));
    var response = '<a href="/">Home</a><br>';
    response += "Files uploaded successfully.<br>";
    response += `<img src="${req?.file?.path}" /><br>`;

    if (req.file) {
      const data = req.file;

      const fileContent = fs.readFileSync(req.file.path);

      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: data.filename,
        Body: fileContent,
        ContentType: data.mimetype,
      });

      const result = await s3.send(putObjectCommand);

      try {
        await prisma.picture.create({
          data: {
            file: data.filename,
          },
        });
      } catch (e) {
        console.log("error", e);
      }

      console.log("result:", result);

      return res.json({
        ok: true,
      });
    } else {
      return res.json({
        error: "Failed to upload image in aws",
      });
    }
  }
);

app.get("/get-profile", async (req, res) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: "test01.png",
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log("url:", url);
    res.json({
      path: "Ok",
    });
  } catch (err) {
    return res.json({
      error: "Failed to get image from aws",
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
