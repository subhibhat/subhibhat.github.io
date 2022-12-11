import { HashRouter as Router, Routes, Route } from "react-router-dom"
import { Layout } from "./components/layout"
import { Home } from "./pages/home"

const App = () => {
    return (
        <Layout>
            <Router>
                <Routes>
                    <Route index element={<Home />} />
                </Routes>
            </Router>
        </Layout>
    )
}

export default App