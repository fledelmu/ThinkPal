// Dashboard Component and related code
const Accomplished = () => {
    return(
        <div className='bg-rule-60 h-full w-full rounded-xl flex flex-row items-center justify-start overflow-hidden'>
            <div className='bg-rule-30 w-[10%] h-[70%] m-10'></div>
            <div className='bg-rule-30 w-[10%] h-[70%] m-10'></div>
            <div className='bg-rule-30 w-[10%] h-[70%] m-10'></div>
            
        </div>
    )
}

const Priority = () => {
    return(
        <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
            <h1>Priority</h1>
        </div>
    )
}

// Shows deadlines
const Summary = () => {
    return(
        <div className='grid grid-cols-1 gap-4 h-full w-full'>
            <div className='h-full flex flex-col justify-start text-left'>
                <h1 className='text-3xl font-bold m-4 text-rule-30'>Notes</h1>
                <Accomplished />
            </div>
        </div>
    )
}

const Stats = () => {
    return(
        <div className='h-full w-full flex flex-col text-left'>
                <h1 className='text-3xl font-bold m-4 text-rule-30'>Quizes</h1>
                <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                    Test
                </div>
        </div>
    )
}


// main()   
const Dashboard = () => {
    return (
        <div className="grid grid-rows-[120px_1fr] gap-2 w-[80vw] h-[95vh] mt-5 ml-32 text-left">
            <Summary />
            <Stats/>
        </div>
    )
}

export { Dashboard };