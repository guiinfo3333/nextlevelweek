import React, {useCallback,useState} from 'react'
import {useDropzone} from 'react-dropzone'
import {FiUpload} from 'react-icons/fi';

import './styles.css';
interface Props {
  onFileUploaded:(File:File) => void;  //recebe um metodo q recebe um File
}
const Dropzone :React.FC<Props> = ({onFileUploaded}) =>{   //desestruturo pegando apenas o onfileuploaded de dentros de props
  
 
  
  const [selectedFileUrl,setSelectedFileUrls] = useState('');
  const onDrop = useCallback(acceptedFiles => {  //vou usar essa funcao para fazer o previow da imagem
    const file = acceptedFiles[0];

    const fileUrl = URL.createObjectURL(file);  //crriando uma url da imagem com a variavel global URL

    setSelectedFileUrls(fileUrl);
    onFileUploaded(file);

  }, [onFileUploaded])

  const {getRootProps, getInputProps} = useDropzone({
      onDrop,
      accept:'image/*'  //permitir todo tipo de imagem
    })

  return (
    <div className="dropzone" {...getRootProps()}>
      <input {...getInputProps()} accept="image/*"/>

    {selectedFileUrl  //se esta variavel existir eu coloco a imagem
      ?<img src={selectedFileUrl} alt="Point thumbnail"/>
      :(
        <p>
        <FiUpload/>
           Imagem do estabelecimento  
            </p>
      )
    }
   
    </div>
  )
}

export default Dropzone;