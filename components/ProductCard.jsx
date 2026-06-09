"use client"
import { deleteProduct } from '@/app/actions';
import React, { useState } from 'react';
import PriceChart from './PriceChart';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp, ExternalLink, Trash2, TrendingDown } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';



const ProductCard = ({product}) => {
    const[showChart,setShowChart]=useState(false);
    const[deleting,setDeleting]=useState(false);
    console.log(product,"orkfijr")
    const handleDelete = async()=>{
        if(!confirm("Remove this product from tracking?")) return;
        setDeleting(true);
       const result= await deleteProduct(product.id)

       if(result.error){
         toast.error(result.error);
       } else{
          toast.success(result.message || "product   deleted succesfully!");
         seturl("");
        }
         setLoading(false);
         
    }
    console.log(product.image_url);

  return (
    <Card className="hover:shadow-lg transition-shadow">
  <CardHeader className={"pd-3"}>
   <div>
     {
        product.image_url && (
            
            <img
                src={product.image_url}
                alt={product.name}
                className='w-20 h-20 object-cover rounded-md border'
            />
        )
     }
     <div className='flex-1 min-w-0'>
       <h3 className='font-semibold text-gray-900'>
            {
                product.name
            }
       </h3>

       <div className='flex items-baseline gap-2'>
          <span className='text-3xl font-bold text-orange-500'>
            {product.currency} {product.current_price}
          </span>
       
      <Badge variant="secondary" className="gap-1">
          <TrendingDown className='w-3 h-3'/>
            Tracking
      </Badge> 
     </div>
     </div>
   </div>
    
    
  </CardHeader>
  <CardContent>
    <div className='flex flex-wrap gap-2'>
      <Button variant='outline'
        size='sm'
        onClick={()=>setShowChart(!showChart)}
        className="gap-1"
        >
        {
            showChart ? (
                <>
                    <ChevronUp className='w-4 h-4'/
                    >
                    Hide Chart
                </>
            ):(<>
                <ChevronDown/>
                Show Chart
            </>
            )
        }
      </Button>

      <Button variant='outline'
       size="sm"
        asChild 
        className="gap-1"
        >
        <Link href={product.url}
        target='_blank'
        rel='noopener noreferrer'
        >
        <ExternalLink className='w-4 h-4'/>
            View Products
        </Link>
      </Button>
      <Button
        variant ="ghost"
         sizr="sm"
         onClick={handleDelete}
         disabled={deleting}
         className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
      >
         <Trash2 className='w-4 h-4'/>
         Remove

      </Button>

    </div>
  </CardContent>
       {
         showChart && (
             <CardFooter className="pt-0">
               <PriceChart productId={product.id}/>
         </CardFooter>
         )
       }
  </Card>
  )
}

export default ProductCard;
