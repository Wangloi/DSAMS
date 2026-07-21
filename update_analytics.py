import re

with open('c:/laragon/www/DSAMS/app/Http/Controllers/AdminAnalyticsController.php', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace $violationStats['minor'] = ...
content = re.sub(r"\$violationStats\['minor'\] = \(clone \$base\)->where\('classification', 'Minor'\)->count\(\);", r"\$violationStats['warning'] = (clone \$base)->where('classification', 'Warning')->count();", content)
content = re.sub(r"\$violationStats\['major'\] = \(clone \$base\)->where\('classification', 'Major'\)->count\(\);", r"\$violationStats['suspension'] = (clone \$base)->where('classification', 'Suspension')->count();\n            \$violationStats['exclusion'] = (clone \$base)->where('classification', 'Exclusion')->count();\n            \$violationStats['expulsion'] = (clone \$base)->where('classification', 'Expulsion')->count();", content)

# Replace daily loop
content = re.sub(r"'minor' => \(int\) \(\$dayData\['Minor'\] \?\? 0\),\s*'major' => \(int\) \(\$dayData\['Major'\] \?\? 0\),", r"'warning' => (int) (\$dayData['Warning'] ?? 0),\n                        'suspension' => (int) (\$dayData['Suspension'] ?? 0),\n                        'exclusion' => (int) (\$dayData['Exclusion'] ?? 0),\n                        'expulsion' => (int) (\$dayData['Expulsion'] ?? 0),", content)

# Replace month loop 1
content = re.sub(r"'minor' => \(int\) \(\$byYm\[\$ym\]\['Minor'\] \?\? 0\),\s*'major' => \(int\) \(\$byYm\[\$ym\]\['Major'\] \?\? 0\),", r"'warning' => (int) (\$byYm[\$ym]['Warning'] ?? 0),\n                    'suspension' => (int) (\$byYm[\$ym]['Suspension'] ?? 0),\n                    'exclusion' => (int) (\$byYm[\$ym]['Exclusion'] ?? 0),\n                    'expulsion' => (int) (\$byYm[\$ym]['Expulsion'] ?? 0),", content)

# Replace week loop 1
content = re.sub(r"'minor' => \(int\) \(\$byYw\[\$yw\]\['Minor'\] \?\? 0\),\s*'major' => \(int\) \(\$byYw\[\$yw\]\['Major'\] \?\? 0\),", r"'warning' => (int) (\$byYw[\$yw]['Warning'] ?? 0),\n                    'suspension' => (int) (\$byYw[\$yw]['Suspension'] ?? 0),\n                    'exclusion' => (int) (\$byYw[\$yw]['Exclusion'] ?? 0),\n                    'expulsion' => (int) (\$byYw[\$yw]['Expulsion'] ?? 0),", content)

# Replace month loop 2
content = re.sub(r"'minor' => \(int\) \(\$monthData\['Minor'\] \?\? 0\),\s*'major' => \(int\) \(\$monthData\['Major'\] \?\? 0\),", r"'warning' => (int) (\$monthData['Warning'] ?? 0),\n                        'suspension' => (int) (\$monthData['Suspension'] ?? 0),\n                        'exclusion' => (int) (\$monthData['Exclusion'] ?? 0),\n                        'expulsion' => (int) (\$monthData['Expulsion'] ?? 0),", content)

# Replace week loop 2
content = re.sub(r"'minor' => \(int\) \(\$weekData\['Minor'\] \?\? 0\),\s*'major' => \(int\) \(\$weekData\['Major'\] \?\? 0\),", r"'warning' => (int) (\$weekData['Warning'] ?? 0),\n                        'suspension' => (int) (\$weekData['Suspension'] ?? 0),\n                        'exclusion' => (int) (\$weekData['Exclusion'] ?? 0),\n                        'expulsion' => (int) (\$weekData['Expulsion'] ?? 0),", content)

# Replace $cls === 'Minor' || $cls === 'Major' logic
content = re.sub(r"if \(!isset\(\$byYm\[\$ym\]\)\) \$byYm\[\$ym\] = \['Minor' => 0, 'Major' => 0\];\s*if \(\$cls === 'Minor' \|\| \$cls === 'Major'\) \{\s*\$byYm\[\$ym\]\[\$cls\] = \(int\) \(\$r->c \?\? 0\);\s*\}", r"if (!isset(\$byYm[\$ym])) \$byYm[\$ym] = ['Warning' => 0, 'Suspension' => 0, 'Exclusion' => 0, 'Expulsion' => 0];\n                if (in_array(\$cls, ['Warning', 'Suspension', 'Exclusion', 'Expulsion'])) {\n                    \$byYm[\$ym][\$cls] = (int) (\$r->c ?? 0);\n                }", content)

content = re.sub(r"if \(!isset\(\$byYw\[\$yw\]\)\) \$byYw\[\$yw\] = \['Minor' => 0, 'Major' => 0\];\s*if \(\$cls === 'Minor' \|\| \$cls === 'Major'\) \{\s*\$byYw\[\$yw\]\[\$cls\] = \(int\) \(\$r->c \?\? 0\);\s*\}", r"if (!isset(\$byYw[\$yw])) \$byYw[\$yw] = ['Warning' => 0, 'Suspension' => 0, 'Exclusion' => 0, 'Expulsion' => 0];\n                if (in_array(\$cls, ['Warning', 'Suspension', 'Exclusion', 'Expulsion'])) {\n                    \$byYw[\$yw][\$cls] = (int) (\$r->c ?? 0);\n                }", content)

with open('c:/laragon/www/DSAMS/app/Http/Controllers/AdminAnalyticsController.php', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
