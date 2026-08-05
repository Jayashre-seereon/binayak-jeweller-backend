import * as designService from "../services/designService.js";
import { getStoreId } from "../utils/storeHelper.js";


// CREATE
export const createDesign = async(req,res)=>{

try{

const storeId = Number(req.query.storeId);
const image = req.file ? req.file.location : null;
const design = await designService.createDesign(
  { ...req.body, image },
  storeId
);

res.status(201).json({
 success:true,
 design
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};



// GET ALL
export const getDesigns = async(req,res)=>{

try{

const storeId = Number(req.query.storeId);

const designs = await designService.getDesigns(storeId);

res.json({
 success:true,
 designs
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};


// GET BY ID
export const getDesignById = async(req,res)=>{

try{

const design = await designService.getDesignById(
 Number(req.params.id),
 Number(req.query.storeId)
);


res.json({
 success:true,
 design
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};



// UPDATE
export const updateDesign = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const image = req.file ? req.file.location : undefined;

    const design = await designService.updateDesign(
      Number(req.params.id),
      { ...req.body, image },
      storeId
    );

    res.json({
      success: true,
      design,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



// DELETE
export const deleteDesign = async(req,res)=>{

try{

const storeId=getStoreId(req);

await designService.deleteDesign(
 Number(req.params.id),
 Number(req.query.storeId)
);


res.json({
success:true,
message:"Deleted"
});


}catch(err){

res.status(400).json({
message:err.message
});

}

};