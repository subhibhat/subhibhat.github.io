import { Icon } from "./Icon"

const SocialItem = ({icon, url}) => {
    return (
        <li>
            <a href={url} target="_blank" rel="noreferrer"><Icon name={icon} className="fa-2x" /></a>
        </li>
    )
}

export default SocialItem