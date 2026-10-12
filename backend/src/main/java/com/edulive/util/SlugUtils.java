package com.edulive.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtils {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "item-" + System.currentTimeMillis();
        }

        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String withoutDiacritics = DIACRITICS.matcher(normalized).replaceAll("");
        // Xử lý đ / Đ trong tiếng Việt
        withoutDiacritics = withoutDiacritics.replace("đ", "d").replace("Đ", "d");
        String slug = NONLATIN.matcher(withoutDiacritics).replaceAll("");
        slug = slug.toLowerCase(Locale.ENGLISH).replaceAll("-{2,}", "-").replaceAll("^-|-$", "");

        return slug.isBlank() ? "item-" + System.currentTimeMillis() : slug;
    }
}
