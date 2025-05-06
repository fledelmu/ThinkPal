const AddNotes = () => {
    return(
        <>  
            <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                Notes
            </div>
            
        </>
    )
}

const ActionsContainer = () => {
    return(
        <div className='flex flex-col h-[110px] w-full  '>
            <h1 className='text-3xl font-bold m-4 text-rule-30'>Notes</h1>
            <AddNotes/>
        </div>
    )
}

const Actions = () => {
    return(
        <div className='bg-rule-60 flex items-center justify-center h-full w-full rounded-xl'>
            Test
        </div>
    )
}
const Notes = () => {
    return(
        <>
            <div className='grid grid-rows-[120px_1fr] gap-1 w-[80vw] h-[95vh] mt-5 ml-64 text-left'>
                <ActionsContainer/>
                <Actions/>
            </div>
        </>
    )
}

export { Notes };