

const Tasks = () => {
    return(
        <div>

        </div>
    )
}

const TaskSection = () => {
    return(
        <div className='h-full flex flex-col justify-start text-left '>
            <h1 className='text-3xl font-bold m-4 text-rule-30'>Goal Manager</h1>
            <div className="grid grid-cols-1 gap-4  h-full w-full">
                <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                    
                    <div className='grid grid-rows-[auto_1fr] h-full w-full'>  
                        <div>
                            <h1 className='text-3xl font-bold m-4 text-rule-30'>New</h1>
                        </div>
                        <div className='grid grid-cols-2 gap-4 h-[30%] p-4 w-full text-white'>
                            
                            <div className='bg-rule-30 rounded-xl w-full h-full'>Test 1</div>
                            <div className='bg-rule-30 rounded-xl w-full h-full'>Test 2</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    )
}

const GoalSection = () => {
    return(
        <div className="grid grid-cols-1 grid-rows-[10%_2fr] gap-4 h-full w-full">
            
            <div className='h-full flex flex-col justify-start text-left'>
                <h1 className='text-3xl font-bold m-4 text-rule-30'>Goals</h1>
                
            </div>

            <div className='h-full flex flex-col justify-start text-left mt-5'>
                <h1 className='text-2xl font-bold m-4 text-rule-30'>Add Goal</h1>
                <div className='bg-rule-60 w-[30%] rounded-xl flex items-center justify-center'>Test</div>
                
            </div>
        </div>
    )
}


export default function Goals() {
    return(
        <>
            <div className="grid grid-rows-[15%_1fr] text-black w-[80vw] h-[95vh] mt-5 ml-64">
                <GoalSection />
                <TaskSection />
            </div>
        </>
    )
}