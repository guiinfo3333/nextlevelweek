import {Request,Response, response} from 'express';
import knex from '../database/connection';



class PointsController{

    async index(req:Request,res:Response){
        const {city,uf,items} =req.query;

        const parsedItems = String(items)
        .split(',')
        .map(item=>Number(item.trim()));

         const points = await knex('points') 
         .join('point_items','points.id','=','point_items.point_id')
         .whereIn('point_items.item_id',parsedItems) //busca de todos os pontos que tem pelo menos um item
        .where('city',String(city))
        .where('uf',String(uf))
        .distinct()
        .select('points.*'); //quero tudo

         
    const serializedPoints = points.map(point =>{ //percorre todos os itens
       
        return{
            ...point,
             image_url:`http://localhost:3333/uploads/${point.image}`,
    
         };
     })
    
         
        return res.json(serializedPoints);

    }

    async show(req:Request,res:Response){
        const {id} = req.params;
        const point = await knex('points').where('id',id).first(); //retorna só um registro

        if(!point){
            return res.status(400).json({message : 'Point not found'});
        }
        
        const serializedPoints = { //percorre todos os itens
                ...point,
                 image_url:`http://localhost:3333/uploads/${point.image}`,
         };

        const items = await knex('items')
        .join('point_items','items.id','=','point_items.item_id')
        .where('point_items.point_id',id)
        .select('items.title');
      
        return res.json({point:serializedPoints,items});
    }

    async create(req:Request,res:Response){
    console.log(req.file.filename);
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        }  = req.body;
      
        const trx = await knex.transaction(); //usada para o caso de como a gente tem varios inserts e se uma falhar eu quero q as outras nao sejam executadas
        const point ={
            image: req.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }
        const insertedIds = await trx('points').insert(point);
        
        const point_id = insertedIds[0];
      
        const pointItems = items
        .split(',')
        .map((item:string)=>Number(item.trim()))
        .map((item_id :number)=>{
            return {
                item_id,
                point_id,
            }
        })
      
        await trx('point_items').insert(pointItems); 

        await trx.commit(); //preciso dar o commit na transaciton
      
        return res.json({
            id:point_id,
            ...point,   //pega tudo o q já tem dentro desse objeto
        });
      
    }

}

export default PointsController;