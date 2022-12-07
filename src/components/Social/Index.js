import { v4 as uuid } from "uuid"
import SocialItem from "./Item"

const SocialBar = () => {

    const data = [
        {icon:'github-square',  url:'https://github.com/subhibhat'},
        {icon:'facebook-square',url:'https://fb.com/subhibhat'},
        {icon:'instagram',      url:'https://instagram.com/subhibhat'},
        {icon:'steam-square',   url:'https://steamcommunity.com/id/subhibhat'},
        {icon:'medium',         url:'https://subhibhat.medium.com'},
    ]

    return (
        <ul className="m-0 p-0 social">
            {data.map(item => <SocialItem key={uuid()} icon={item.icon} url={item.url} />)}
        </ul>
    )
}

export default SocialBar