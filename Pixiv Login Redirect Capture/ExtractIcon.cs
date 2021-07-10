using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Runtime.InteropServices;
using System.IO;
using System.Drawing;

namespace Pixiv_Login_Redirect_Capture
{
    class ExtractIcon
    {
        /// <summary>   
        /// 返回系统设置的图标   
        /// </summary>   
        /// <param name="lpszFile">文件名,指定从exe文件或dll文件引入icon</param>   
        /// <param name="nIconIndex">文件的图表中的第几个,指定icon的索引如果为0则从指定的文件中引入第1个icon</param>   
        /// <param name="phiconLarge">返回的大图标的指针,大图标句柄如果为null则为没有大图标</param>   
        /// <param name="phiconSmall">返回的小图标的指针,小图标句柄如果为null则为没有小图标</param>   
        /// <param name="nIcons">ico个数,找几个图标</param>   
        /// <returns></returns>
        [DllImport("shell32.dll")]
        public static extern uint ExtractIconEx(string lpszFile, int nIconIndex, int[] phiconLarge, int[] phiconSmall, uint nIcons);

        /// <summary>
        /// 清除图标
        /// </summary>
        /// <param name="hIcon">图标句柄</param>
        /// <returns>返回非零表示成功，零表示失败</returns>
        [DllImport("User32.dll", EntryPoint = "DestroyIcon")]
        public static extern int DestroyIcon(IntPtr hIcon);

        public static Icon GetIcon(string lpszFile, int nIconIndex, bool isLarge)
        {
            Icon resultIcon = null;
            if (File.Exists(lpszFile))
            {
                //调用API方法读取图标
                int[] phiconLarge = new int[1];
                int[] phiconSmall = new int[1];
                uint count = ExtractIconEx(lpszFile, nIconIndex, phiconLarge, phiconSmall, 1); //241就是剪贴板图标
                IntPtr IconHnd = new IntPtr(isLarge ? phiconLarge[0] : phiconSmall[0]);
                resultIcon = Icon.FromHandle(IconHnd).Clone() as Icon;
                DestroyIcon(IconHnd);
            }
            return resultIcon;
        }
    }
}
