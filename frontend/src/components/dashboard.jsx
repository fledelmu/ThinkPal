// Dashboard Component and related code
const Accomplished = () => {
    return(
        <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
            <h1>Deadlines</h1>
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
                <h1 className='text-3xl font-bold m-4 text-rule-30'>Deadlines</h1>
                <Accomplished />
            </div>
        </div>
    )
}

const Stats = () => {
    return(
        <div className='h-full w-full flex flex-col text-left'>
                <h1 className='text-3xl font-bold m-4 text-rule-30'>Statistics</h1>
                <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                    Test
                </div>
        </div>
    )
}


// main()   
const Dashboard = () => {
    return (
        <div className="grid grid-rows-[300px_1fr] text-black gap-4 w-[80vw] h-[95vh] mt-5 ml-64">
            <Summary />
            <Stats/>
        </div>
    )
}

export { Dashboard };