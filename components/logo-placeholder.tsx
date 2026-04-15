import React from "react";
import { Image, View } from "react-native";

export const LogoPlaceholder = () => {
  return (
    <View className="h-28 w-28 items-center justify-center rounded-lg mb-5 ">
      <Image
        source={require("@/assets/images/DMS_LOGO.png")}
        className="h-44 w-44"
        resizeMode="contain"
      />
    </View>
  );
};
