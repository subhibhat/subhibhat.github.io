import { useEffect, useState } from "react"
import SocialBar from "../Social/Index"

const Header = ({photo,login}) => {
    const [myAge, setAge] = useState()

    const getAge = date => {
        const today = new Date()
        const birth = new Date(date)
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
    
        if (m < 0 || (m===0 && today.getDate() < birth.getDate())) {
            age--
        }
        
        setAge(age)
    }

    useEffect(() => {
        getAge('04-11-1994')
    },[])
    
    return (
        <header className="text-light mt-5">
            <div className="row justify-content-center my-4">
                <div className="col col-md-6 text-center">
                    <img src={photo} alt={login} className="rounded profile" />
                    <div className="my-4">
                        <p className="m-0" style={{textTransform: 'capitalize'}}>
                            <strong>Subhibhat Srikham</strong>
                        </p>
                        <p><small>Si Sa Ket, Thailand</small></p>
                        {/* <p>สวัสดีครับ, ผมชื่อสุพิพัฒน์ ศรีคำ ชื่อเล่น โอ๊ต อายุ {myAge} ปี<br />ปัจจุบันกำลังศึกษารัฐศาสตร์ แผน C (บริหารรัฐกิจ) มหาวิทยาลัยรามคำแหง </p> */}
                    </div>
                    <SocialBar />
                </div>
            </div>
        </header>
    )
}

export default Header