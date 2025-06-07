import quiz_img from '../assets/images/quiz_img.png';
import { useEffect, useState } from 'react';
import { getQuizzes, getTitle } from '../utils/api';

const SearchNotes = () => {
    return(
        <>  
            <div className='bg-rule-60 h-full w-full rounded-xl flex items-center justify-center'>
                <input type='text' 
                placeholder='Search Quiz...' 
                className='bg-rule-60 h-[50px] w-full rounded-xl p-4 text-white'/>
            </div>
            
        </>
    )
}

const SearchContainer = () => {
    return(
        <div className='flex flex-col h-[110px] w-full'>
            <h1 className='text-3xl font-bold m-4 text-rule-text'>Quizzes</h1>
            <SearchNotes/>
        </div>
    )
}

const QuizCard = ({ quizData }) => {
    const [score, setScore] = useState(0);
    const [answer, setAnswer] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentQuiz = quizData.quizzes[currentIndex];

    useEffect(() => {
        console.log('Updated score:', score);
    }, [score]);

    const handleSubmit = () => {
        if (!currentQuiz) return;

        if (answer.trim().toLowerCase() === currentQuiz.answer.toLowerCase()) {
            setScore(prev => prev + 1);
            console.log('Correct! Score:', score + 1);
        } else {
            console.log('Incorrect. Correct answer:', currentQuiz.answer);
        }

        setAnswer('');

        // Move to the next question if there is one
        if (currentIndex < quizData.quizzes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            console.log('Quiz completed!');
            // You can add a callback to exit or display results
        }
    };

    if (!currentQuiz) return <p>No quizzes available.</p>;

    return (
        <div className='w-full h-full flex flex-col items-center justify-center'>
            <div className='relative flex flex-col items-center justify-center bg-rule-60 w-[70%] h-[70%] m-2 rounded-xl text-white'>
                <div className='absolute top-5 right-5 text-2xl font-bold'>{score}</div>
                <h3 className='text-center text-2xl w-[80%]'>
                    {currentQuiz.question}
                </h3>
            </div>

            <div className='bg-rule-60 w-[65%] border-2 h-[5%] m-2 rounded-xl text-white flex flex-row items-center'>
                <input
                    type='text'
                    placeholder='Answer here...'
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className='bg-rule-60 h-full w-[90%] rounded-xl p-4 text-white'
                />
                <button
                    onClick={handleSubmit}
                    className='p-1 rounded w-[7%] bg-rule-10 text-black'
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

const QuizScreen = ({ quizData, onExit }) => {
    return (
        <div className='fixed top-0 left-[13.5rem] w-[calc(100vw-13.5rem)] h-screen flex items-center justify-center z-50'>
            <div className='bg-rule-bg border-2 border-rule-60 w-[85vw] h-[95vh] rounded-xl flex flex-col items-center'>
                <div className="bg-rule-60 flex items-center h-[7%] rounded-tl-xl rounded-tr-xl w-full">
                    <button
                        className='text-black bg-rule-10 px-3 m-5 py-1 rounded'
                        onClick={onExit}
                    >
                        Exit
                    </button>
                </div>
                <QuizCard quizData={quizData} />
            </div>
        </div>
    );
};


const QuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [inQuiz, setInQuiz] = useState(false);

    useEffect(() => {
        const loadQuizzes = async () => {
            const data = await getQuizzes();
            setQuizzes(data);

            const grouped = data.reduce((acc, quiz) => {
                if (!acc[quiz.note_num]) {
                    acc[quiz.note_num] = [];
                }
                acc[quiz.note_num].push(quiz);
                return acc;
            }, {});

            const groupedArray = Object.entries(grouped).map(([note_num, quizzes]) => ({
                note_num: Number(note_num),
                quizzes,
            }));
            
            setQuizzes(groupedArray);
        };

        loadQuizzes();
    }, []); 

    const showQuiz = (quiz) => {
        setSelectedQuiz(quiz);
        setInQuiz(true);
    };

    return (
        <>
            <div className='bg-rule-bg grid grid-cols-5 justify-start h-full w-full rounded-xl overflow-y-auto'>
                {quizzes.map((quiz, index) => (
                    <div
                        key={quiz.quiz_num}
                        className='relative group bg-rule-30 w-[175px] h-[200px] m-8 rounded-xl text-white overflow-hidden'
                    >
                        <img
                            src={quiz_img}
                            alt='quiz image'
                            className='w-full h-full rounded-xl object-cover'
                        />
                        <div className='absolute inset-0 bg-black bg-opacity-20 rounded-xl flex flex-col gap-2 items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <h3 className='mb-10'>
                                {'Untitled Quiz ' + (index + 1)}
                            </h3>
                            <button
                                onClick={() => showQuiz(quiz)}
                                className='text-black bg-rule-10 px-3 m-5 py-1 rounded'
                            >
                                Open
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {inQuiz && selectedQuiz && (
                <QuizScreen
                    quizData={selectedQuiz}
                    onExit={() => setInQuiz(false)}
                />
            )}
        </>
    );
};

export default function Quiz() {
    return(
        <>
            <div className='grid grid-rows-[120px_1fr] gap-2 w-[80vw] h-[95vh] mt-5 ml-40 text-left'>
                <SearchContainer/>
                <QuizList/>
            </div>
        </>
    )
}