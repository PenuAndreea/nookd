import { Image, View } from "react-native";


const LOGO_SIZE = 32;
const LOGO_URI = require('../../../assets/images/logo.png');
const LOGO_ALT = 'Nookd Logo';
const LOGO_BORDER_RADIUS = 8;

export default function Logo() {
    return (
        <View style={logoStyles.container}>
            <Image
                source={LOGO_URI}
                style={logoStyles.image}
                accessibilityLabel={LOGO_ALT}
            />
        </View>
    )
}

export const logoStyles = {
    container: {
        paddingHorizontal: 20,
    },
    image: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: LOGO_BORDER_RADIUS,
    },
}