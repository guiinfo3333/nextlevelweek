import React, {useEffect,useState,ChangeEvent,FormEvent} from 'react';

import './styles.css';

import logo from '../../assets/logo.svg';
import {Link,useHistory} from  'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import {Map,TileLayer,Marker} from 'react-leaflet';
import api from '../../services/api';
import Dropzone from '../../components/Dropzone';
import axios from 'axios';
import {LeafletMouseEvent} from 'leaflet';

interface Item{
    id:number;
    title:string;
    image_url:string;
}
interface IBGEUFResponse{
    sigla:string;
}

interface IBGECityResponse {
    nome:string;
}

const CreatePoint =() =>{

    //precisamos informar o tipo criano uma interface
    const [items,setItems] = useState<Item[]>([]);
    const [ufs,setUfs] = useState<string[]>([]); //array de strings
    const[cities,setCities] = useState<string[]>([]);
    const [initialPosition,setinitialPosition] = useState<[number,number]>([0,0]);
    const[selectedUf,setSelectedUf] = useState('0');
    const[selectedCity,setSelectedCity] = useState('0');
    const[selectedItems,setSelectedItems] = useState<number[]>([]);
    const [selectedPosition,setselectedPosition] = useState<[number,number]>([0,0]);
    const[formData,setFormData] = useState({
        name:'',
        email: '',
        whatsapp:''
    });
    const[selectedFile,setSelectedFile] = useState<File>(); //vai armazenar um objeto do tipo file


    const history = useHistory();

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position =>{
            const {latitude,longitude} = position.coords;
            setinitialPosition([latitude,longitude]);
        })  //retorna a posicao inicial do usuario
    },[])

    useEffect(()=>{
        api.get('items').then(res=>{
           setItems(res.data);
           console.log(items);
        })

    },[]);  //vai ser executado uma única vez quando o componente for carregado

    useEffect(()=>{  //retorna um array desse tipo
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(res=>{
            const ufInitial = res.data.map(uf=>uf.sigla);

            setUfs(ufInitial);
            
        });

    },[]);

    useEffect(()=>{
        //carregar as cidades sempre que a uf mudar
        if(selectedUf==='0'){
            return;
        }
        axios
        .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(res=>{
            const cityNames = res.data.map(city=>city.nome);

            setCities(cityNames);
            });

    },[selectedUf]);

    function handleSelectUf(event:ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    }
    function handleSelectCity(event:ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    }
    function handleMapClick(event:LeafletMouseEvent){
        setselectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    function handleInputChange(event:ChangeEvent<HTMLInputElement>){
        const {name,value} = event.target;

        setFormData({...formData,[name]:value});
    }
    function handleSelectItem(id:number){

        const alreadySelected = selectedItems.findIndex(item=>item===id);  //find index retorna um numero acima de 0 ou igual a 0 se já existir esse item dentro do arraay
       
        if(alreadySelected>=0){
            const filteredItems = selectedItems.filter(item=>item!==id);
             setSelectedItems(filteredItems);

      
            }else{
           
           setSelectedItems([...selectedItems,id]);
       }

    }

   async function handleSubmit(event:FormEvent){


  
        event.preventDefault();
        const {name,email,whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude,longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData(); //agora eu tenho q mandar um objeto multipartformdata pra dar certo
        
            data.append('name',name);
            data.append('email',email);
            data.append('whatsapp',whatsapp);
            data.append('uf',uf);
            data.append('city',city);
            data.append('latitude',String(latitude));
            data.append('longitude',String(longitude));
            data.append('items',items.join(','));

            if(selectedFile){
                data.append('image',selectedFile);
            }


      await api.post('points',data);
      alert('Ponto de coleta criado!');
      history.push('/');
    }

    return (
<div id="page-create-point">
    <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to = "/">
            <FiArrowLeft/>
            Voltar para home
        </Link>
    </header>
        <form onSubmit={handleSubmit}>
            <h1>Cadastro do <br/> ponto de coleta</h1>
            <Dropzone onFileUploaded={setSelectedFile}/>
            <fieldset>
                <legend>
                    <h2>Dados</h2>
                </legend>
                <div className="field">
                    <label htmlFor="name">Nome da entidade</label>
                    <input 
                    type="text"
                    name="name"
                    id="name"
                    onChange={handleInputChange}
                    />
                </div>
                <div className="field-group">
                    <div className="field">
                        <label htmlFor="name">E-mail</label>
                        <input 
                        type="text"
                        name="email"
                        id="email"
                        onChange={handleInputChange}
                        />
                        
                    </div>
                    <div className="field">
                        <label htmlFor="name">Whatsapp</label>
                        <input 
                        type="text"
                        name="whatsapp"
                        id="whatsapp"
                        onChange={handleInputChange}
                        />
                    </div>

                </div>
            </fieldset>
            <fieldset>
                <legend>
                    <h2>Endereço</h2>
                    <span>Selecione um endereço no mapa</span>
                </legend>
                <Map center={initialPosition} zoom={15} onclick={handleMapClick} >
                <TileLayer
                 attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
               <Marker position={selectedPosition} />
                />
                </Map>
                <div className="field-group">
                    <div className="field">
                        <label htmlFor="uf">Estado(UF)</label>

                        <select 
                        name="uf"
                        id="uf"
                        value={selectedUf} 
                        onChange={handleSelectUf}
                        >

                            <option value="0">Selecione uma UF</option>
                            {ufs.map(uf=>(
                                <option key={uf} value={uf}>{uf}</option>
                            ))};
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="city">cidade</label>
                        <select
                          name="city"
                          id="city"
                          value={selectedCity}
                          onChange={handleSelectCity}
                          >
                            <option value="0">Selecione uma cidade</option>
                            {cities.map(city=>(
                                <option key={city} value={city}>{city}</option>
                            ))};
                        </select>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>
                    <h2>Itens de coleta</h2>
                    <span>Selecione um ou mais itens abaixo</span>
                </legend>
                <ul className="items-grid">
                    {items.map(item=>(
                    <li 
                    key={item.id} 
                    onClick={()=>handleSelectItem(item.id)}
                    className={selectedItems.includes(item.id)?'selected':''} //se ele já tiver inserido add essa classe
                    >
                        <img src={item.image_url} alt={item.title} />
                    <span>{item.title}</span>
                    </li>
                    ))};
                 
                </ul>
            </fieldset>
            <button type="submit">
                Cadastrar ponto de coleta
            </button>
        </form>

</div>

    );

};

export default CreatePoint;