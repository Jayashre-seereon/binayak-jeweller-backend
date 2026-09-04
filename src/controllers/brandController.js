import * as brandService from "../services/brandService.js";
import { getStoreId } from "../utils/storeHelper.js";


// CREATE
export const createBrand = async(req,res)=>{

try{

const storeId = Number(req.query.storeId);

const brand = await brandService.createBrand(
  req.body,
  storeId
);

res.status(201).json({
 success:true,
 brand
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};



// GET ALL
export const getBrands = async(req,res)=>{

try{

const storeId = Number(req.query.storeId);

const brands = await brandService.getBrands(storeId);

res.json({
 success:true,
 brands
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};


// GET BY ID
export const getBrandById = async(req,res)=>{

try{

const brand = await brandService.getBrandById(
 Number(req.params.id),
 Number(req.query.storeId)
);


res.json({
 success:true,
 brand
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};



// UPDATE
export const updateBrand = async(req,res)=>{

try{

const storeId=getStoreId(req);

const brand = await brandService.updateBrand(
 Number(req.params.id),
 req.body,
 Number(req.query.storeId)
);


res.json({
success:true,
brand
});


}catch(err){

res.status(400).json({
message:err.message
});

}

};



// DELETE
export const deleteBrand = async(req,res)=>{

try{

const storeId=getStoreId(req);

await brandService.deleteBrand(
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