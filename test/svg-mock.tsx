import { View } from 'react-native';

// Metro (via react-native-svg-transformer) turns a `.svg` import into a React
// component; Jest's default asset transform doesn't, so a bare SVG import
// resolves to a non-component and crashes any test that renders one. This
// stands in for every `.svg` import in tests.
export default function MockSvg(props: object) {
    return <View {...props} />;
}
