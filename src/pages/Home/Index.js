import axios from "axios"
import { useEffect, useState } from "react"
import Header from "../../components/Home/Header"

const Home = () => {
    const [profile, setProfile] = useState({})
    
    const getGithubData = async () => {
        const github = 'https://api.github.com/users/subhibhat'
        const result = await axios.get(github)

        setProfile(result.data)
    }

    useEffect(() => {getGithubData()}, [])

    const { avatar_url, login } = profile

    return (
        <div className="container">
            <Header photo={avatar_url} login={login} />
        </div>
    )
}

export default Home