import multerS3 from 'multer-s3';
import multer from 'multer';
import path from 'path';
import ShortUniqueId from 'short-unique-id';
import s3 from "./s3.middleware.js";

const uuid = new ShortUniqueId({ length: 12 });

const s3Storage = multerS3({
   s3: s3,
   bucket: "disputesmanagement",
   metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
   },
   contentType: multerS3.AUTO_CONTENT_TYPE,
   key: function (req, file, cb) {
      console.log("key", file);
      cb(null, "attachments/" + uuid.rnd() + path.extname(file.originalname));
   },
});
const upload = multer({
   storage: s3Storage,
   fileFilter: function (req, file, callback) {
      console.log("upload");
      var ext = path.extname(file.originalname);
      console.log("File name from upload:",file.originalname);
      console.log("Extension : ", ext);
      // if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".svg") {
      //    return callback(new Error("file not supported"));
      // }

      callback(null, true);
   },
   limits: {
      fileSize: 2024 * 2024,
   },
}).fields([
   { name: "dispute_doc", maxCount: 1 },
]);

// console.log("Upload Middleware : ",upload,uuid,s3Storage);

export default upload;
