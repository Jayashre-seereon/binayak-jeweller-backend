import * as partytypeService from "../services/partytypeService.js";
import { getStoreId } from "../utils/storeHelper.js";


// CREATE
export const createPartyType = async(req,res)=>{

try{

const storeId = Number(req.query.storeId);

const partytype = await partytypeService.createPartyType(
  req.body,
  storeId
);

res.status(201).json({
 success:true,
 partytype
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};



// GET ALL
export const getPartyTypes = async(req,res)=>{

try{

const storeId = Number(req.query.storeId);

const partytypes = await partytypeService.getPartyTypes(storeId);

res.json({
 success:true,
 partytypes
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};


// GET BY ID
export const getPartyTypeById = async(req,res)=>{

try{

const partytype = await partytypeService.getPartyTypeById(
 Number(req.params.id),
 Number(req.query.storeId)
);


res.json({
 success:true,
 partytype
});

}catch(err){

res.status(400).json({
 message:err.message
});

}

};



// UPDATE
export const updatePartyType = async(req,res)=>{

try{

const storeId=getStoreId(req);

const partytype = await partytypeService.updatePartyType(
 Number(req.params.id),
 req.body,
 Number(req.query.storeId)
);


res.json({
success:true,
partytype
});


}catch(err){

res.status(400).json({
message:err.message
});

}

};



// DELETE
export const deletePartyType = async(req,res)=>{

try{

const storeId=getStoreId(req);

await partytypeService.deletePartyType(
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