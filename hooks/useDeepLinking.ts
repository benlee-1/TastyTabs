 import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { VideoParserService, RecipeData } from "@/app/services/videoParser";

export const useDeepLinking = () => {
  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const parser = VideoParserService.getInstance();
        const data = await parser.handleDeepLink(event.url);

        if (data) {
          setRecipeData(data);
        } else {
          setError("Could not parse the video URL");
        }
      } catch (err) {
        setError("An error occurred while processing the video");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Handle deep links when the app is already open
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle deep links when the app is opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { recipeData, isLoading, error };
};
