import Pic from '../assets/icons/ThinkPal.png';

const Sidebar = ({ setActive }) => {
    return(
        <>
            <div className='fixed top-0 left-0 h-full w-56 flex flex-col items-center bg-rule-60  text-white font-bold text-lg p-4 gap-2 '>
                <div  className='m-5'>
                    <img src={Pic}/>    
                </div>

                <div className='flex flex-col w-full h-[10%] gap-5'>
                    {/*<button className='hover:bg-rule-10 p-5 rounded-xl' onClick={() => setActive("Dashboard")}>Dashboard</button>*/}
                    <button className='hover:bg-rule-bg hover:text-black p-5' onClick={() => setActive("Notes")}>Notes</button>
                    <button className='hover:bg-white hover:text-black p-5' onClick={() => setActive("Quizes")}>Quiz</button>
                    {/*<button className='hover:bg-rule-10 p-5 rounded-xl' onClick={() => setActive("Routines")}>Routines</button>*/}
                </div>
            </div>                                                 
        </>
    )
}

export default Sidebar