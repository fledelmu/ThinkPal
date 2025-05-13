import quiz_img from '../assets/images/quiz_img.png';
import { useState } from 'react'
;
const SearchNotes = () => {
    return(
        <>  
            <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                <input type='text' 
                placeholder='Search Quiz...' 
                className='bg-rule-30 h-[50px] w-full rounded-xl p-4 text-white'/>
            </div>
            
        </>
    )
}

const SearchContainer = () => {
    return(
        <div className='flex flex-col h-[110px] w-full  '>
            <h1 className='text-3xl font-bold m-4 text-rule-30'>Quizes</h1>
            <SearchNotes/>
        </div>
    )
}

const QuizList = () => {
    const items = Array(10).fill("");
    return(
        <div className='bg-rule-60 grid grid-cols-5 justify-start h-full w-full rounded-xl overflow-x-auto'>
            {items.map((_, index) => (
                <button key={index} className='bg-rule-30 w-[175px] h-[200px] m-8 rounded-xl text-white'>
                    <img src={quiz_img} alt='notebook image' className='w-full h-full rounded-xl'/>
                </button>
            ))}
            
        </div>
    )
}
    
export default function Quiz() {
    return(
        <>
            <div className='grid grid-rows-[120px_1fr] gap-2 w-[80vw] h-[95vh] mt-5 ml-64 text-left'>
                <SearchContainer/>
                <QuizList/>
            </div>
        </>
    )
}