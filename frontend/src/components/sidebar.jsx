import Pic from '../assets/icons/ThinkPal.png';

const Sidebar = ({ setActive }) => {
    return(
        <>
            <div className='fixed top-0 left-0 h-full w-56 flex flex-col bg-rule-60 text-white text-lg p-3'>
                <div className='p-2'>
                    <img src={Pic} className="w-52 h-auto" alt="Sidebar Logo" />
                </div>
                <div className='text-left w-full'>
                    Actions
                </div>
                <div className='flex flex-col w-full gap-5 mt-3 border-b-2  border-rule-text pb-3'>
                    <button className='hover:bg-rule-bg hover:text-black' onClick={() => setActive("Notes")}>Notes</button>
                    <button className='hover:bg-white hover:text-black' onClick={() => setActive("Quizes")}>Quiz</button>
                </div>
            </div>                                                
        </>
    )
}

export default Sidebar