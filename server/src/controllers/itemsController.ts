import {Request,Response} from 'express';
import knex from '../database/connection';

class itemsController {


async index(req:Request,res:Response){

    const items = await knex('items').select('*');
   
    const serializedItems = items.map(item =>{ //percorre todos os itens
       
       return{
            id:item.id,
            title: item.title,
            image_url:`http://localhost:3333/uploads/${item.image}`,
   
        };
    })
    return res.json(serializedItems);
   
   

}
}
export default itemsController;
