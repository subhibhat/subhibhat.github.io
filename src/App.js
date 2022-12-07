import { HashRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home/Index"

const App = () => {

    const Instagram = () => <div>eiei</div>

    return (
        <Router>
            <Routes>
                <Route index element={<Home />} />
                <Route path="/instagram" element={<Instagram />} />
            </Routes>
        </Router>
    )
}

export default App